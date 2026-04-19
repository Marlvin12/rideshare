import { Router } from 'express';
import {
  requireMerchantFirebaseAuth,
  requireLinkedRestaurant,
  optionalFirebaseAuth,
} from '../middleware/merchantAuth.js';
import {
  submitApplication,
  getMyApplication,
  getStorefront,
  updateStorefront,
  getMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMerchantOrders,
  updateMerchantOrder,
} from '../controllers/merchantController.js';

const router = Router();

// ---------------------------------------------------------------------------
// Identity probe — merchant web apps use this to verify session + restaurant link
// ---------------------------------------------------------------------------
router.get('/me', requireMerchantFirebaseAuth, (req, res) => {
  res.json({
    role: req.user.role,
    restaurantId: req.user.restaurantId?.toString() ?? null,
  });
});

// ---------------------------------------------------------------------------
// Application routes
// POST /apply is intentionally public: an applicant can submit before creating
// an account. If a Firebase token is present, it links the application to the
// user record so they can track status later.
// ---------------------------------------------------------------------------
router.post('/apply', optionalFirebaseAuth, submitApplication);
router.get('/application', requireMerchantFirebaseAuth, getMyApplication);

// ---------------------------------------------------------------------------
// Storefront routes — require merchant Firebase auth + linked restaurant
// ---------------------------------------------------------------------------
const storefrontMiddleware = [requireMerchantFirebaseAuth, requireLinkedRestaurant];

router.get('/restaurant', ...storefrontMiddleware, getStorefront);
router.patch('/restaurant', ...storefrontMiddleware, updateStorefront);

// ---------------------------------------------------------------------------
// Menu routes
// ---------------------------------------------------------------------------
router.get('/menu', ...storefrontMiddleware, getMenu);
router.post('/menu', ...storefrontMiddleware, addMenuItem);
router.patch('/menu/:itemId', ...storefrontMiddleware, updateMenuItem);
router.delete('/menu/:itemId', ...storefrontMiddleware, deleteMenuItem);

// ---------------------------------------------------------------------------
// Order routes
// ---------------------------------------------------------------------------
router.get('/orders', ...storefrontMiddleware, getMerchantOrders);
router.patch('/orders/:orderId', ...storefrontMiddleware, updateMerchantOrder);

export default router;
