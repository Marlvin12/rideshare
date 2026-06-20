import logger from '../config/logger.js';
import FoodOrder from '../models/FoodOrder.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import EarningsTransaction from '../models/EarningsTransaction.js';
import {
  getRestaurantById as getMockRestaurantById,
  getMenuItemById as getMockMenuItemById,
} from '../utils/mockEatsData.js';

import { assertStatusTransition } from '../utils/orderStatus.js';
import { getDeliveryFeeRange, estimateFoodDeliveryWindow, computeFoodTax, sumFoodOrderTotal, normalizeTip, computeCourierDeliveryEarnings } from '../utils/mapUtils.js';
import { COURIER_PUBLIC_FIELDS } from '../constants/orderProjections.js';
import { evaluatePromo, recordRedemption } from './promotions.js';

const USE_MOCK_DATA =
  process.env.NODE_ENV === 'production'
    ? false
    : process.env.USE_MOCK_DATA === '1' || process.env.USE_MOCK_DATA === 'true';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DEFAULT_MAX_DELIVERY_KM = 25;
const PLATFORM_FEE_RATE = 0.1;
const VALID_ITEM_PREFERENCES = ['merchant_recommend', 'refund', 'contact_me', 'cancel_order'];

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Validates an order payload against restaurant rules and current inventory.
 * Returns either an error shape or the fully-computed pricing and resolved items.
 * Does NOT persist anything — safe to call as a dry-run before createOrder.
 */
const runOrderValidation = async ({ restaurantId, items, deliveryAddress }) => {
  let restaurant;
  if (USE_MOCK_DATA) {
    restaurant = getMockRestaurantById(restaurantId);
  } else {
    restaurant = await Restaurant.findById(restaurantId);
  }

  if (!restaurant) {
    return {
      ok: false,
      statusCode: 404,
      code: 'RESTAURANT_NOT_FOUND',
      message: 'Restaurant not found',
      details: { restaurantId },
    };
  }

  if (!restaurant.isOpen) {
    return {
      ok: false,
      statusCode: 400,
      code: 'RESTAURANT_CLOSED',
      message: 'This restaurant is currently closed',
      details: { restaurantId },
    };
  }

  let itemsTotal = 0;
  const unavailableItems = [];
  const orderItems = items.map((item) => {
    let menuItem;
    if (USE_MOCK_DATA) {
      menuItem = getMockMenuItemById(item.menuItemId);
    }

    const sourcePrice = menuItem ? menuItem.price : item.price;
    const itemPrice = typeof sourcePrice === 'number' ? sourcePrice : 0;

    if (menuItem && menuItem.isAvailable === false) {
      unavailableItems.push({ menuItemId: item.menuItemId, name: item.name });
    }

    const subtotal = itemPrice * item.quantity;
    itemsTotal += subtotal;

    return {
      menuItemId: item.menuItemId,
      name: item.name || (menuItem ? menuItem.name : 'Unknown Item'),
      price: itemPrice,
      quantity: item.quantity,
      customizations: item.customizations || {},
      subtotal,
      specialInstructions: item.specialInstructions,
    };
  });

  if (unavailableItems.length > 0) {
    return {
      ok: false,
      statusCode: 409,
      code: 'ITEMS_UNAVAILABLE',
      message: 'One or more items are no longer available',
      details: { items: unavailableItems },
    };
  }

  const deliveryDistance = calculateDistance(
    restaurant.location.latitude,
    restaurant.location.longitude,
    deliveryAddress.latitude,
    deliveryAddress.longitude
  );

  const maxKm =
    typeof restaurant.maxDeliveryDistanceKm === 'number'
      ? restaurant.maxDeliveryDistanceKm
      : DEFAULT_MAX_DELIVERY_KM;

  if (deliveryDistance > maxKm) {
    return {
      ok: false,
      statusCode: 400,
      code: 'ADDRESS_OUT_OF_RANGE',
      message: "Delivery address is outside this restaurant's delivery area",
      details: { maxKm, distanceKm: parseFloat(deliveryDistance.toFixed(2)) },
    };
  }

  if (itemsTotal < (restaurant.minimumOrder || 0)) {
    return {
      ok: false,
      statusCode: 400,
      code: 'MINIMUM_ORDER_NOT_MET',
      message: `Minimum order amount is ${restaurant.minimumOrder}`,
      details: { minimumOrder: restaurant.minimumOrder || 0, itemsTotal },
    };
  }

  const { min, max, estimate } = getDeliveryFeeRange(deliveryDistance);
  const platformFee = parseFloat((itemsTotal * PLATFORM_FEE_RATE).toFixed(2));
  const deliveryFee = estimate;
  const tax = computeFoodTax(itemsTotal);
  const total = sumFoodOrderTotal({ itemsTotal, deliveryFee, platformFee, tax });

  return {
    ok: true,
    restaurant,
    orderItems,
    deliveryDistance,
    pricing: { itemsTotal, deliveryFee, platformFee, tax, total },
    suggestedFeeRange: { min, max, estimate },
  };
};

/**
 * Dry-run validation endpoint. Checks all constraints and returns live pricing
 * without creating an order. Used by checkout for pre-submit price/inventory refresh.
 */
export const validateOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress } = req.body;
    const result = await runOrderValidation({ restaurantId, items, deliveryAddress });

    if (!result.ok) {
      return res.status(result.statusCode).json({
        valid: false,
        code: result.code,
        message: result.message,
        details: result.details,
      });
    }

    return res.status(200).json({ valid: true, pricing: result.pricing });
  } catch (error) {
    logger.error({ err: error }, 'validateOrder failed');
    res.status(500).json({ valid: false, code: 'SERVER_ERROR', message: 'Validation failed' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      deliveryAddress,
      paymentMethod,
      channel,
      unavailableItemPreference,
      idempotencyKey,
      tip: rawTip,
      promoCode: rawPromoCode,
    } = req.body;
    const customerId = req.user.id;

    // Idempotency: return existing order if this key was already used by this customer.
    if (idempotencyKey) {
      const existing = await FoodOrder.findOne({ customerId, idempotencyKey });
      if (existing) {
        return res.status(200).json({ success: true, msg: 'Order already placed', order: existing });
      }
    }

    const validation = await runOrderValidation({ restaurantId, items, deliveryAddress });

    if (!validation.ok) {
      return res.status(validation.statusCode).json({
        success: false,
        code: validation.code,
        message: validation.message,
        details: validation.details,
      });
    }

    const { restaurant, orderItems, deliveryDistance, pricing, suggestedFeeRange } = validation;
    const { itemsTotal, deliveryFee, platformFee, tax } = pricing;
    // Optional customer tip (BE-20). Validated server-side and folded into the
    // total; passed through 100% to the courier on delivery.
    const tip = normalizeTip(rawTip);

    // Optional promo (BE-24): authoritatively re-validate + recompute the discount
    // server-side from the REAL items subtotal — never trust a client-sent amount.
    // A failed/invalid code rejects the order so the customer isn't silently
    // charged full price after expecting a discount.
    let discount = 0;
    let appliedPromo = null;
    if (rawPromoCode) {
      const promoResult = await evaluatePromo({ code: rawPromoCode, subtotal: itemsTotal, userId: customerId });
      if (!promoResult.ok) {
        return res.status(promoResult.status).json({ success: false, msg: promoResult.msg });
      }
      discount = promoResult.discount;
      appliedPromo = promoResult.promo;
    }

    const total = sumFoodOrderTotal({ itemsTotal, deliveryFee, platformFee, tax, tip, discount });

    const order = new FoodOrder({
      customerId,
      restaurantId,
      items: orderItems,
      pricing: {
        itemsTotal,
        deliveryFee,
        platformFee,
        tax,
        tip,
        discount,
        promoCode: appliedPromo ? appliedPromo.code : null,
        total,
        restaurantShare: itemsTotal,
        platformShare: platformFee,
        courierShare: 0,
      },
      deliveryAddress,
      restaurantAddress: restaurant.location,
      deliveryDistance,
      suggestedDeliveryFee: suggestedFeeRange,
      status: 'pending',
      paymentMethod: paymentMethod || 'cash',
      channel: channel || 'app',
      estimatedPreparationTime: restaurant.preparationTime || 30,
      timeline: [{ status: 'pending', timestamp: new Date(), message: 'Order placed' }],
      unavailableItemPreference:
        VALID_ITEM_PREFERENCES.includes(unavailableItemPreference)
          ? unavailableItemPreference
          : undefined,
      idempotencyKey: idempotencyKey || undefined,
    });

    await order.save();

    // Record the redemption now that the order exists (best-effort: the discount
    // is already applied + persisted, so a failed record must not fail the order).
    if (appliedPromo) {
      try {
        await recordRedemption({ promo: appliedPromo, userId: customerId, discountAmount: discount, orderId: order._id });
      } catch (err) {
        logger.error({ err, orderId: order._id }, 'promo redemption record failed (discount already applied)');
      }
    }

    const io = req.io;
    if (io) {
      io.to(`restaurant_${restaurantId}`).emit('order:new', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        total: order.pricing.total,
        deliveryAddress: order.deliveryAddress,
        unavailableItemPreference: order.unavailableItemPreference,
      });
    }

    res.status(201).json({ success: true, msg: 'Order placed successfully', order });
  } catch (error) {
    logger.error({ err: error }, 'createOrder failed');
    res.status(500).json({ success: false, msg: 'Failed to create order' });
  }
};

/**
 * Called by a merchant when a cart item becomes unavailable during preparation.
 * Executes the customer's pre-selected unavailability preference and emits the
 * appropriate socket events so the customer is notified without polling.
 */
export const handleItemUnavailable = async (req, res) => {
  try {
    const { id } = req.params;
    const { menuItemId } = req.body;

    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    }

    const allowedStatuses = ['pending', 'restaurant_accepted', 'preparing'];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ORDER_STATE',
        message: 'Item availability can only be reported while the order is being prepared',
      });
    }

    const affectedItem = order.items.find((i) => i.menuItemId.toString() === menuItemId);
    if (!affectedItem) {
      return res.status(404).json({
        success: false,
        code: 'ITEM_NOT_IN_ORDER',
        message: 'Item not found in this order',
      });
    }

    const preference = order.unavailableItemPreference || 'contact_me';
    const io = req.io;
    let actionTaken;

    if (preference === 'refund') {
      order.items = order.items.filter((i) => i.menuItemId.toString() !== menuItemId);
      order.pricing.itemsTotal = parseFloat((order.pricing.itemsTotal - affectedItem.subtotal).toFixed(2));
      order.pricing.platformFee = parseFloat((order.pricing.itemsTotal * PLATFORM_FEE_RATE).toFixed(2));
      // Recompute tax on the reduced subtotal and fold it back into the total —
      // previously the refund path left tax stale AND dropped it from the total,
      // breaking the breakdown invariant once a tax rate is configured (BE-13 review).
      order.pricing.tax = computeFoodTax(order.pricing.itemsTotal);
      order.pricing.total = sumFoodOrderTotal(order.pricing);
      order.timeline.push({
        status: order.status,
        timestamp: new Date(),
        message: `Item "${affectedItem.name}" refunded — unavailable`,
      });
      actionTaken = 'refunded';

      if (io) {
        io.to(`order_${id}`).emit('order:item_unavailable', {
          orderId: id,
          menuItemId,
          itemName: affectedItem.name,
          action: 'refunded',
          updatedPricing: order.pricing,
        });
      }
    } else if (preference === 'cancel_order') {
      try {
        assertStatusTransition(order.status, 'cancelled');
      } catch {
        return res.status(400).json({
          success: false,
          code: 'CANNOT_CANCEL',
          message: 'Order cannot be cancelled at this stage',
        });
      }
      order.status = 'cancelled';
      order.cancellationReason = `Item "${affectedItem.name}" became unavailable`;
      order.timeline.push({
        status: 'cancelled',
        timestamp: new Date(),
        message: 'Order cancelled — item unavailable',
      });
      actionTaken = 'cancelled';

      if (io) {
        io.to(`order_${id}`).emit('order:status', {
          orderId: id,
          status: 'cancelled',
          message: `Your order was cancelled because "${affectedItem.name}" is no longer available`,
        });
        io.to(`restaurant_${order.restaurantId}`).emit('order:cancelled', {
          orderId: id,
          orderNumber: order.orderNumber,
        });
      }
    } else {
      // 'merchant_recommend' → customer picks alternative; 'contact_me' → direct contact
      const action = preference === 'merchant_recommend' ? 'select_replacement' : 'contact_required';
      order.timeline.push({
        status: order.status,
        timestamp: new Date(),
        message: `Item "${affectedItem.name}" unavailable — customer notified`,
      });
      actionTaken = action;

      if (io) {
        io.to(`order_${id}`).emit('order:item_unavailable', {
          orderId: id,
          menuItemId,
          itemName: affectedItem.name,
          action,
        });
      }
    }

    await order.save();
    res.status(200).json({ success: true, preference, actionTaken, order });
  } catch (error) {
    logger.error({ err: error }, 'handleItemUnavailable failed');
    res.status(500).json({ success: false, msg: 'Failed to process item unavailability' });
  }
};

export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || 'customer';
    const { status } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const query = {};
    if (userRole === 'customer') {
      query.customerId = userId;
    } else if (userRole === 'rider') {
      query.courierId = userId;
    }
    if (status) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      FoodOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('restaurantId', 'name imageUrl')
        .populate('courierId', COURIER_PUBLIC_FIELDS),
      FoodOrder.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    logger.error({ err: error }, 'getOrders failed');
    res.status(500).json({ success: false, msg: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await FoodOrder.findById(id)
      .populate('restaurantId', 'name imageUrl location contactPhone')
      .populate('courierId', COURIER_PUBLIC_FIELDS)
      .populate('customerId', 'name phone');

    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    const isOwner =
      order.customerId?._id?.toString() === userId ||
      order.courierId?._id?.toString() === userId;
    if (!isOwner) {
      return res.status(403).json({ success: false, msg: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    logger.error({ err: error }, 'getOrderById failed');
    res.status(500).json({ success: false, msg: 'Failed to fetch order' });
  }
};

export const restaurantAcceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { preparationTime } = req.body;

    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    try {
      assertStatusTransition(order.status, 'restaurant_accepted');
    } catch (e) {
      return res.status(400).json({ success: false, msg: 'Order cannot be accepted in current state' });
    }

    order.status = 'restaurant_accepted';
    order.estimatedPreparationTime = preparationTime || order.estimatedPreparationTime;
    order.timeline.push({
      status: 'restaurant_accepted',
      timestamp: new Date(),
      message: `Order accepted. Prep time: ${order.estimatedPreparationTime} mins`,
    });

    await order.save();

    const io = req.io;
    if (io) {
      io.to(`order_${id}`).emit('order:status', {
        orderId: id,
        status: order.status,
        message: 'Restaurant has accepted your order',
        preparationTime: order.estimatedPreparationTime,
      });
    }

    res.status(200).json({ success: true, msg: 'Order accepted', order });
  } catch (error) {
    logger.error({ err: error }, 'restaurantAcceptOrder failed');
    res.status(500).json({ success: false, msg: 'Failed to accept order' });
  }
};

export const restaurantRejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    try {
      assertStatusTransition(order.status, 'cancelled');
    } catch (e) {
      return res.status(400).json({ success: false, msg: 'Order cannot be rejected in current state' });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason || 'Restaurant unavailable';
    order.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      message: 'Order rejected by restaurant',
    });

    await order.save();

    const io = req.io;
    if (io) {
      io.to(`order_${id}`).emit('order:status', {
        orderId: id,
        status: 'cancelled',
        message: 'Order rejected by restaurant',
      });
    }

    res.status(200).json({ success: true, msg: 'Order rejected', order });
  } catch (error) {
    logger.error({ err: error }, 'restaurantRejectOrder failed');
    res.status(500).json({ success: false, msg: 'Failed to reject order' });
  }
};

const COURIER_SEARCH_INTERVAL_MS = 15_000;
const COURIER_SEARCH_MAX_RETRIES = 20;
const MAX_COURIER_DISTANCE_M = 60_000;

async function assignNearestCourier(order, io) {
  const geolib = (await import('geolib')).default;
  const onDutyRiders = io._onDutyRiders;
  if (!onDutyRiders) {
    logger.warn({ orderId: order._id }, 'No onDutyRiders map available');
    return;
  }

  const restaurantCoords = {
    latitude: order.restaurantAddress?.latitude,
    longitude: order.restaurantAddress?.longitude,
  };

  if (!restaurantCoords.latitude || !restaurantCoords.longitude) {
    logger.warn({ orderId: order._id }, 'Order missing restaurant coordinates');
    return;
  }

  let retries = 0;

  const tryAssign = async () => {
    const freshOrder = await FoodOrder.findById(order._id).select('status');
    if (!freshOrder || freshOrder.status !== 'courier_searching') return;

    const candidates = Array.from(onDutyRiders.entries())
      .map(([riderId, data]) => ({
        riderId,
        socketId: data.socketId,
        distance: geolib.getDistance(data.coords, restaurantCoords),
      }))
      .filter((r) => r.distance <= MAX_COURIER_DISTANCE_M)
      .sort((a, b) => a.distance - b.distance);

    if (candidates.length > 0) {
      const chosen = candidates[0];
      const courier = await User.findById(chosen.riderId).select('name phone stats.rating');

      freshOrder.status = 'courier_assigned';
      freshOrder.courierId = chosen.riderId;

      const deliveryFee = order.pricing.deliveryFee;
      freshOrder.pricing = {
        ...order.pricing,
        courierShare: deliveryFee,
      };

      freshOrder.timeline.push(
        { status: 'courier_assigned', timestamp: new Date(), message: 'Courier auto-assigned' }
      );

      // Real delivery-window estimate (BE-6a), replacing a flat +30min. Kitchen
      // prep and the courier's drive to the restaurant run in parallel; then the
      // restaurant->customer leg + handling. chosen.distance is meters.
      const restaurantToCustomerKm = calculateDistance(
        restaurantCoords.latitude,
        restaurantCoords.longitude,
        order.deliveryAddress?.latitude,
        order.deliveryAddress?.longitude,
      );
      const deliveryWindow = estimateFoodDeliveryWindow({
        courierToRestaurantKm: chosen.distance / 1000,
        restaurantToCustomerKm,
        prepMinutes: order.estimatedPreparationTime,
        now: Date.now(),
      });
      // Keep the single legacy field (upper bound) and add the [min,max] window.
      freshOrder.estimatedDeliveryTime = deliveryWindow.etaMax;
      freshOrder.estimatedDeliveryWindow = {
        min: deliveryWindow.etaMin,
        max: deliveryWindow.etaMax,
      };

      await freshOrder.save();

      if (io) {
        io.to(`order_${order._id}`).emit('order:status', {
          orderId: order._id,
          status: 'courier_assigned',
          message: 'A courier has been assigned to your order',
          courier: courier ? { name: courier.name, rating: courier.stats?.rating || 5.0 } : null,
        });

        io.to(`courier_${chosen.riderId}`).emit('delivery:assignment', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          restaurantAddress: order.restaurantAddress,
          deliveryAddress: order.deliveryAddress,
          deliveryFee,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        });
      }

      logger.info({ orderId: order._id, courierId: chosen.riderId }, 'Courier auto-assigned');
      return;
    }

    retries++;
    if (retries >= COURIER_SEARCH_MAX_RETRIES) {
      const staleOrder = await FoodOrder.findById(order._id);
      if (staleOrder && staleOrder.status === 'courier_searching') {
        staleOrder.status = 'cancelled';
        staleOrder.cancellationReason = 'No couriers available';
        staleOrder.timeline.push({
          status: 'cancelled',
          timestamp: new Date(),
          message: 'No couriers available after extended search',
        });
        await staleOrder.save();

        if (io) {
          io.to(`order_${order._id}`).emit('order:status', {
            orderId: order._id,
            status: 'cancelled',
            message: 'No couriers are available right now. Your order has been cancelled.',
          });
        }
      }
      logger.warn({ orderId: order._id }, 'Courier search timed out');
      return;
    }

    setTimeout(tryAssign, COURIER_SEARCH_INTERVAL_MS);
  };

  tryAssign();
}

export const markReady = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    try {
      assertStatusTransition(order.status, 'courier_searching');
    } catch (e) {
      return res.status(400).json({ success: false, msg: 'Order is not in a preparable state' });
    }

    order.status = 'courier_searching';
    order.readyForPickupAt = new Date();
    order.timeline.push(
      { status: 'ready_for_pickup', timestamp: new Date(), message: 'Food is ready for pickup' },
      { status: 'courier_searching', timestamp: new Date(), message: 'Searching for nearest courier' }
    );

    await order.save();

    const io = req.io;
    if (io) {
      io.to(`order_${id}`).emit('order:status', {
        orderId: id,
        status: 'courier_searching',
        message: 'Food is ready! Finding a courier...',
      });
    }

    assignNearestCourier(order, io);

    res.status(200).json({ success: true, msg: 'Order ready for pickup, searching for courier', order });
  } catch (error) {
    logger.error({ err: error }, 'markReady failed');
    res.status(500).json({ success: false, msg: 'Failed to mark order as ready' });
  }
};

export const placeBid = async (req, res) => {
  res.status(410).json({ success: false, msg: 'Bidding has been removed. Couriers are now auto-assigned.' });
};

export const acceptBid = async (req, res) => {
  res.status(410).json({ success: false, msg: 'Bidding has been removed. Couriers are now auto-assigned.' });
};

export const markPickedUp = async (req, res) => {
  try {
    const { id } = req.params;
    const courierId = req.user.id;

    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    if (!order.courierId || order.courierId.toString() !== courierId.toString()) {
      return res.status(403).json({ success: false, msg: 'You are not assigned to this order' });
    }

    try {
      assertStatusTransition(order.status, 'picked_up');
    } catch (e) {
      return res.status(400).json({ success: false, msg: 'Order cannot be marked as picked up in current state' });
    }

    order.status = 'picked_up';
    order.timeline.push({ status: 'picked_up', timestamp: new Date(), message: 'Courier has picked up your order' });
    await order.save();

    const io = req.io;
    if (io) {
      io.to(`order_${id}`).emit('order:status', { orderId: id, status: 'picked_up', message: 'Your food has been picked up!' });
    }

    res.status(200).json({ success: true, msg: 'Order marked as picked up', order });
  } catch (error) {
    logger.error({ err: error }, 'markPickedUp failed');
    res.status(500).json({ success: false, msg: 'Failed to mark as picked up' });
  }
};

export const markInTransit = async (req, res) => {
  try {
    const { id } = req.params;
    const courierId = req.user.id;

    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    if (!order.courierId || order.courierId.toString() !== courierId.toString()) {
      return res.status(403).json({ success: false, msg: 'You are not assigned to this order' });
    }

    try {
      assertStatusTransition(order.status, 'in_transit');
    } catch (e) {
      return res.status(400).json({ success: false, msg: 'Order cannot be marked in transit in current state' });
    }

    order.status = 'in_transit';
    order.timeline.push({ status: 'in_transit', timestamp: new Date(), message: 'Courier is on the way' });
    await order.save();

    const io = req.io;
    if (io) {
      io.to(`order_${id}`).emit('order:status', { orderId: id, status: 'in_transit', message: 'Your order is on its way!' });
    }

    res.status(200).json({ success: true, msg: 'Order in transit', order });
  } catch (error) {
    logger.error({ err: error }, 'markInTransit failed');
    res.status(500).json({ success: false, msg: 'Failed to update order status' });
  }
};

export const markDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryProofImage } = req.body;
    const courierId = req.user.id;

    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    if (!order.courierId || order.courierId.toString() !== courierId.toString()) {
      return res.status(403).json({ success: false, msg: 'You are not assigned to this order' });
    }

    try {
      assertStatusTransition(order.status, 'delivered');
    } catch (e) {
      return res.status(400).json({ success: false, msg: 'Order cannot be marked as delivered in current state' });
    }

    order.status = 'delivered';
    order.actualDeliveryTime = new Date();
    order.paymentStatus = 'completed';
    if (deliveryProofImage) order.deliveryProofImage = deliveryProofImage;
    order.timeline.push({ status: 'delivered', timestamp: new Date(), message: 'Order delivered successfully' });
    await order.save();

    const courierEarnings = computeCourierDeliveryEarnings({
      courierShare: order.pricing?.courierShare,
      deliveryFee: order.pricing?.deliveryFee,
      tip: order.pricing?.tip,
    });
    await User.findByIdAndUpdate(courierId, {
      $inc: { 'earnings.total': courierEarnings, 'earnings.available': courierEarnings },
    });
    await EarningsTransaction.create({
      userId: courierId,
      amount: courierEarnings,
      type: 'delivery',
      referenceType: 'FoodOrder',
      referenceId: order._id,
    });

    const restaurantShare = order.pricing?.restaurantShare ?? order.pricing.itemsTotal;
    if (restaurantShare > 0 && order.restaurantId) {
      await Restaurant.findByIdAndUpdate(order.restaurantId, { $inc: { 'earnings.available': restaurantShare } });
      await EarningsTransaction.create({
        restaurantId: order.restaurantId,
        amount: restaurantShare,
        type: 'order_settlement',
        referenceType: 'FoodOrder',
        referenceId: order._id,
      });
    }

    const io = req.io;
    if (io) {
      io.to(`order_${id}`).emit('order:status', { orderId: id, status: 'delivered', message: 'Your order has been delivered!' });
      io.to(`courier_${courierId}`).emit('delivery:completed', { orderId: id, earnings: courierEarnings });
    }

    res.status(200).json({ success: true, msg: 'Order delivered successfully', order, courierEarnings });
  } catch (error) {
    logger.error({ err: error }, 'markDelivered failed');
    res.status(500).json({ success: false, msg: 'Failed to mark as delivered' });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    if (order.customerId.toString() !== userId) {
      return res.status(403).json({ success: false, msg: 'Not authorized to cancel this order' });
    }

    try {
      assertStatusTransition(order.status, 'cancelled');
    } catch (e) {
      return res.status(400).json({ success: false, msg: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.timeline.push({ status: 'cancelled', timestamp: new Date(), message: 'Order cancelled by customer' });
    await order.save();

    const io = req.io;
    if (io) {
      io.to(`order_${id}`).emit('order:status', { orderId: id, status: 'cancelled', message: 'Order has been cancelled' });
      io.to(`restaurant_${order.restaurantId}`).emit('order:cancelled', { orderId: id, orderNumber: order.orderNumber });
      if (order.courierId) {
        io.to(`courier_${order.courierId}`).emit('delivery:cancelled', { orderId: id });
      }
    }

    res.status(200).json({ success: true, msg: 'Order cancelled', order });
  } catch (error) {
    logger.error({ err: error }, 'cancelOrder failed');
    res.status(500).json({ success: false, msg: 'Failed to cancel order' });
  }
};

export const rateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantRating, courierRating } = req.body;
    const userId = req.user.id;

    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    if (order.customerId.toString() !== userId) {
      return res.status(403).json({ success: false, msg: 'Not authorized to rate this order' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, msg: 'Can only rate delivered orders' });
    }

    if (restaurantRating) {
      order.ratings.restaurant = { score: restaurantRating.score, comment: restaurantRating.comment, timestamp: new Date() };
    }
    if (courierRating) {
      order.ratings.courier = { score: courierRating.score, comment: courierRating.comment, timestamp: new Date() };
    }

    await order.save();
    res.status(200).json({ success: true, msg: 'Rating submitted successfully', order });
  } catch (error) {
    logger.error({ err: error }, 'rateOrder failed');
    res.status(500).json({ success: false, msg: 'Failed to submit rating' });
  }
};

export const getAvailableDeliveries = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const query = { status: 'courier_searching' };
    const [orders, total] = await Promise.all([
      FoodOrder.find(query)
        .populate('restaurantId', 'name imageUrl location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FoodOrder.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    logger.error({ err: error }, 'getAvailableDeliveries failed');
    res.status(500).json({ success: false, msg: 'Failed to fetch available deliveries' });
  }
};

export const getCourierActiveDelivery = async (req, res) => {
  try {
    const courierId = req.user.id;
    const order = await FoodOrder.findOne({
      courierId,
      status: { $in: ['courier_assigned', 'picked_up', 'in_transit'] },
    })
      .populate('restaurantId', 'name imageUrl location contactPhone')
      .populate('customerId', 'name phone');

    if (!order) {
      return res.status(200).json({ success: true, hasActiveDelivery: false, order: null });
    }

    res.status(200).json({ success: true, hasActiveDelivery: true, order });
  } catch (error) {
    logger.error({ err: error }, 'getCourierActiveDelivery failed');
    res.status(500).json({ success: false, msg: 'Failed to fetch active delivery' });
  }
};

export const getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status, date } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const query = { restaurantId };
    if (status) query.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const [orders, total] = await Promise.all([
      FoodOrder.find(query)
        .populate('customerId', 'name phone')
        .populate('courierId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FoodOrder.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    logger.error({ err: error }, 'getRestaurantOrders failed');
    res.status(500).json({ success: false, msg: 'Failed to fetch restaurant orders' });
  }
};

export const updateCourierLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, heading } = req.body;
    const courierId = req.user.id;

    const order = await FoodOrder.findById(id).select('courierId');
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    const courierIdStr = courierId != null ? String(courierId) : '';
    if (!order.courierId || order.courierId.toString() !== courierIdStr) {
      return res.status(403).json({ success: false, msg: 'Not authorized to update location for this order' });
    }

    const io = req.io;
    if (io) {
      io.to(`order_${id}`).emit('courier:location', { orderId: id, location: { latitude, longitude, heading } });
    }

    res.status(200).json({ success: true, msg: 'Location updated' });
  } catch (error) {
    logger.error({ err: error }, 'updateCourierLocation failed');
    res.status(500).json({ success: false, msg: 'Failed to update location' });
  }
};
