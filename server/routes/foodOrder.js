import express from 'express';
import {
  createOrder,
  validateOrder,
  getOrders,
  getOrderById,
  restaurantAcceptOrder,
  restaurantRejectOrder,
  markReady,
  placeBid,
  acceptBid,
  markPickedUp,
  markInTransit,
  markDelivered,
  cancelOrder,
  rateOrder,
  getAvailableDeliveries,
  getCourierActiveDelivery,
  getRestaurantOrders,
  updateCourierLocation,
  handleItemUnavailable,
} from '../controllers/foodOrder.js';
import validate, {
  createOrderSchema,
  validateOrderSchema,
  acceptOrderSchema,
  rejectOrderSchema,
  placeBidSchema,
  acceptBidSchema,
  cancelOrderSchema,
  rateOrderSchema,
  courierLocationSchema,
  deliveryProofSchema,
  itemUnavailableSchema,
  paginationSchema,
} from '../middleware/validate.js';

const router = express.Router();

router.post('/create', validate(createOrderSchema), createOrder);
router.post('/validate', validate(validateOrderSchema), validateOrder);

router.get('/', validate(paginationSchema, 'query'), getOrders);
router.get('/available-deliveries', validate(paginationSchema, 'query'), getAvailableDeliveries);
router.get('/active-delivery', getCourierActiveDelivery);
router.get('/restaurant/:restaurantId', validate(paginationSchema, 'query'), getRestaurantOrders);
router.get('/:id', getOrderById);

router.patch('/:id/restaurant-accept', validate(acceptOrderSchema), restaurantAcceptOrder);
router.patch('/:id/restaurant-reject', validate(rejectOrderSchema), restaurantRejectOrder);
router.patch('/:id/ready', markReady);
router.patch('/:id/item-unavailable', validate(itemUnavailableSchema), handleItemUnavailable);

router.post('/:id/bid', validate(placeBidSchema), placeBid);
router.patch('/:id/accept-bid', validate(acceptBidSchema), acceptBid);

router.patch('/:id/pickup', markPickedUp);
router.patch('/:id/in-transit', markInTransit);
router.patch('/:id/deliver', validate(deliveryProofSchema), markDelivered);
router.patch('/:id/cancel', validate(cancelOrderSchema), cancelOrder);

router.post('/:id/rate', validate(rateOrderSchema), rateOrder);
router.post('/:id/courier-location', validate(courierLocationSchema), updateCourierLocation);

export default router;
