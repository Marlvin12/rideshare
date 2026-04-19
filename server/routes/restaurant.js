import express from 'express';
import {
  getRestaurants,
  getRestaurantById,
  getRestaurantMenu,
  searchRestaurants,
  createRestaurant,
  updateRestaurant,
  toggleRestaurantStatus,
  partnerSetRestaurantStatus,
  partnerSetRestaurantPreparationTime,
  addMenuItem,
  updateMenuItem,
  updateMenuItemAvailability,
  deleteMenuItem,
  getCuisines,
} from '../controllers/restaurant.js';
import adminAuth from '../middleware/adminAuth.js';
import auth from '../middleware/authentication.js';
import validate, {
  createRestaurantSchema,
  addMenuItemSchema,
  paginationSchema,
} from '../middleware/validate.js';

const router = express.Router();

router.get('/', validate(paginationSchema, 'query'), getRestaurants);
router.get('/search', validate(paginationSchema, 'query'), searchRestaurants);
router.get('/cuisines', getCuisines);
router.get('/:id', getRestaurantById);
router.get('/:id/menu', getRestaurantMenu);

router.post('/create', adminAuth, validate(createRestaurantSchema), createRestaurant);
router.patch('/:id', adminAuth, updateRestaurant);
router.patch('/:id/toggle-status', adminAuth, toggleRestaurantStatus);
router.patch('/:id/partner-status', auth, partnerSetRestaurantStatus);
router.patch('/:id/partner-preparation-time', auth, partnerSetRestaurantPreparationTime);

router.post('/:id/menu/item', adminAuth, validate(addMenuItemSchema), addMenuItem);
router.patch('/:id/menu/item/:itemId', adminAuth, updateMenuItem);
router.patch('/:id/menu/item/:itemId/availability', auth, updateMenuItemAvailability);
router.delete('/:id/menu/item/:itemId', adminAuth, deleteMenuItem);

export default router;
