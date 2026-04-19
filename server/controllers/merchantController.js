/**
 * Merchant controller
 *
 * All handlers assume req.user is populated by requireMerchantFirebaseAuth
 * and (for restaurant-scoped routes) requireLinkedRestaurant.
 *
 * Responses use a stable snake_case DTO for external merchant web clients.
 */

import mongoose from 'mongoose';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import FoodOrder from '../models/FoodOrder.js';
import MerchantApplication from '../models/MerchantApplication.js';
import User from '../models/User.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';

// ---------------------------------------------------------------------------
// Serializers
// ---------------------------------------------------------------------------

function serializeRestaurant(r) {
  const cuisineArr = Array.isArray(r.cuisine) ? r.cuisine : [r.cuisine].filter(Boolean);
  return {
    id: r._id.toString(),
    name: r.name,
    cuisine: cuisineArr.join(', '),
    rating: r.rating ?? 0,
    delivery_time_min: r.preparationTime ?? 25,
    delivery_time_max: (r.preparationTime ?? 25) + 15,
    delivery_fee: r.deliveryFee ?? 0,
    min_order: r.minimumOrder ?? 0,
    image_url: r.imageUrl ?? '',
    tags: cuisineArr,
    default_prep_minutes: r.preparationTime ?? 25,
    is_paused: !r.isOpen,
    busy_mode_until: r.busyModeUntil ?? null,
    operating_hours: r.openingHours ?? {},
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

function serializeMenuItem(m) {
  return {
    id: m._id.toString(),
    name: m.name,
    description: m.description ?? '',
    price: m.price,
    category: m.category,
    image_url: m.imageUrl ?? '',
    is_available: m.isAvailable ?? true,
    is_vegetarian: m.isVegetarian ?? false,
    preparation_time: m.preparationTime ?? 15,
    customizations: m.customizations ?? [],
    sort_order: 0,
  };
}

const RIDESHARE_TO_MERCHANT_STATUS = {
  pending: 'pending',
  restaurant_accepted: 'confirmed',
  preparing: 'preparing',
  ready_for_pickup: 'ready_for_pickup',
  bidding_open: 'ready_for_pickup',
  courier_assigned: 'courier_assigned',
  picked_up: 'picked_up',
  in_transit: 'in_transit',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

const MERCHANT_TO_RIDESHARE_STATUS = {
  confirmed: 'restaurant_accepted',
  preparing: 'preparing',
  ready_for_pickup: 'ready_for_pickup',
  cancelled: 'cancelled',
};

function serializeOrder(o) {
  return {
    id: o._id.toString(),
    user_id: o.customerId?.toString() ?? '',
    restaurant_id: o.restaurantId?.toString() ?? '',
    delivery_address: o.deliveryAddress?.address ?? '',
    note: o.note ?? null,
    subtotal: o.pricing?.itemsTotal ?? 0,
    delivery_fee: o.pricing?.deliveryFee ?? 0,
    total: o.pricing?.total ?? 0,
    status: RIDESHARE_TO_MERCHANT_STATUS[o.status] ?? o.status,
    ready_for_pickup_at: o.readyForPickupAt ?? null,
    delay_used: o.delayUsed ?? false,
    rider_id: o.courierId?.toString() ?? null,
    estimated_preparation_time: o.estimatedPreparationTime ?? null,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    items: (o.items ?? []).map((i) => ({
      id: i.menuItemId?.toString() ?? '',
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  };
}

// ---------------------------------------------------------------------------
// Application handlers (open to any authenticated user pre-approval)
// ---------------------------------------------------------------------------

export const submitApplication = async (req, res) => {
  const { restaurantName, ownerName, email, phone, city, cuisineType, address } = req.body;

  const existing = await MerchantApplication.findOne({
    email: email.trim().toLowerCase(),
    status: { $in: ['submitted', 'under_review', 'approved'] },
  });

  if (existing) {
    throw new BadRequestError('An active application already exists for this email');
  }

  const application = await MerchantApplication.create({
    restaurantName,
    ownerName,
    email,
    phone,
    city,
    cuisineType,
    address,
    applicantUserId: req.user?.id ?? null,
  });

  res.status(201).json({ application });
};

export const getMyApplication = async (req, res) => {
  const application = await MerchantApplication.findOne({
    applicantUserId: req.user.id,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!application) {
    return res.json({ application: null });
  }

  res.json({ application });
};

// ---------------------------------------------------------------------------
// Storefront handlers (merchant + linked restaurant required)
// ---------------------------------------------------------------------------

export const getStorefront = async (req, res) => {
  const restaurant = await Restaurant.findById(req.user.restaurantId).lean();

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  res.json({ restaurant: serializeRestaurant(restaurant) });
};

export const updateStorefront = async (req, res) => {
  const {
    name,
    cuisine,
    delivery_fee,
    min_order,
    image_url,
    default_prep_minutes,
    is_paused,
    busy_mode_until,
    operating_hours,
  } = req.body;

  const update = {};

  if (name !== undefined) update.name = name;
  if (cuisine !== undefined) {
    update.cuisine = typeof cuisine === 'string'
      ? cuisine.split(',').map((c) => c.trim()).filter(Boolean)
      : cuisine;
  }
  if (delivery_fee !== undefined) update.deliveryFee = Number(delivery_fee);
  if (min_order !== undefined) update.minimumOrder = Number(min_order);
  if (image_url !== undefined) update.imageUrl = image_url;
  if (default_prep_minutes !== undefined) update.preparationTime = Number(default_prep_minutes);
  if (is_paused !== undefined) update.isOpen = !is_paused;
  if (busy_mode_until !== undefined) update.busyModeUntil = busy_mode_until ? new Date(busy_mode_until) : null;
  if (operating_hours !== undefined) update.openingHours = operating_hours;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.user.restaurantId,
    { $set: update },
    { new: true, runValidators: true }
  ).lean();

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  res.json({ restaurant: serializeRestaurant(restaurant) });
};

// ---------------------------------------------------------------------------
// Menu handlers
// ---------------------------------------------------------------------------

export const getMenu = async (req, res) => {
  const items = await MenuItem.find({ restaurantId: req.user.restaurantId }).lean();
  res.json({ menu: items.map(serializeMenuItem) });
};

export const addMenuItem = async (req, res) => {
  const {
    name,
    description,
    price,
    category,
    image_url,
    is_available,
    is_vegetarian,
    preparation_time,
    customizations,
  } = req.body;

  const item = await MenuItem.create({
    restaurantId: req.user.restaurantId,
    name,
    description,
    price: Number(price),
    category,
    imageUrl: image_url,
    isAvailable: is_available ?? true,
    isVegetarian: is_vegetarian ?? false,
    preparationTime: preparation_time ? Number(preparation_time) : 15,
    customizations: customizations ?? [],
  });

  res.status(201).json({ item: serializeMenuItem(item) });
};

export const updateMenuItem = async (req, res) => {
  const { itemId } = req.params;

  if (!mongoose.isValidObjectId(itemId)) {
    throw new BadRequestError('Invalid item ID');
  }

  const item = await MenuItem.findOne({
    _id: itemId,
    restaurantId: req.user.restaurantId,
  });

  if (!item) {
    throw new NotFoundError('Menu item not found');
  }

  const {
    name,
    description,
    price,
    category,
    image_url,
    is_available,
    is_vegetarian,
    preparation_time,
    customizations,
  } = req.body;

  if (name !== undefined) item.name = name;
  if (description !== undefined) item.description = description;
  if (price !== undefined) item.price = Number(price);
  if (category !== undefined) item.category = category;
  if (image_url !== undefined) item.imageUrl = image_url;
  if (is_available !== undefined) item.isAvailable = is_available;
  if (is_vegetarian !== undefined) item.isVegetarian = is_vegetarian;
  if (preparation_time !== undefined) item.preparationTime = Number(preparation_time);
  if (customizations !== undefined) item.customizations = customizations;

  await item.save();

  res.json({ item: serializeMenuItem(item) });
};

export const deleteMenuItem = async (req, res) => {
  const { itemId } = req.params;

  if (!mongoose.isValidObjectId(itemId)) {
    throw new BadRequestError('Invalid item ID');
  }

  const item = await MenuItem.findOneAndDelete({
    _id: itemId,
    restaurantId: req.user.restaurantId,
  });

  if (!item) {
    throw new NotFoundError('Menu item not found');
  }

  res.status(204).send();
};

// ---------------------------------------------------------------------------
// Order handlers
// ---------------------------------------------------------------------------

export const getMerchantOrders = async (req, res) => {
  const { status, limit = 50 } = req.query;

  const query = { restaurantId: req.user.restaurantId };

  if (status) {
    const rideshareStatus = MERCHANT_TO_RIDESHARE_STATUS[status];
    query.status = rideshareStatus ?? status;
  } else {
    query.status = {
      $in: ['pending', 'restaurant_accepted', 'preparing', 'ready_for_pickup', 'bidding_open'],
    };
  }

  const orders = await FoodOrder.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  res.json({ orders: orders.map(serializeOrder) });
};

export const updateMerchantOrder = async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.isValidObjectId(orderId)) {
    throw new BadRequestError('Invalid order ID');
  }

  const order = await FoodOrder.findOne({
    _id: orderId,
    restaurantId: req.user.restaurantId,
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const { status, preparation_time, delay_minutes } = req.body;

  if (status) {
    const rideshareStatus = MERCHANT_TO_RIDESHARE_STATUS[status];

    if (!rideshareStatus) {
      throw new BadRequestError(
        `Invalid status. Allowed: ${Object.keys(MERCHANT_TO_RIDESHARE_STATUS).join(', ')}`
      );
    }

    const allowedTransitions = {
      pending: ['restaurant_accepted', 'cancelled'],
      restaurant_accepted: ['preparing', 'cancelled'],
      preparing: ['ready_for_pickup', 'cancelled'],
    };

    if (!allowedTransitions[order.status]?.includes(rideshareStatus)) {
      throw new BadRequestError(
        `Cannot transition from '${order.status}' to '${rideshareStatus}'`
      );
    }

    order.status = rideshareStatus;

    if (rideshareStatus === 'ready_for_pickup') {
      order.readyForPickupAt = new Date();
    }
  }

  if (preparation_time !== undefined) {
    order.estimatedPreparationTime = Number(preparation_time);
  }

  if (delay_minutes !== undefined && Number(delay_minutes) > 0) {
    order.estimatedPreparationTime =
      (order.estimatedPreparationTime ?? 0) + Number(delay_minutes);
    order.delayUsed = true;
  }

  await order.save();

  res.json({ order: serializeOrder(order) });
};
