import express from 'express';
import {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getAllRides,
  getKYCSubmissions,
  getFinancials,
  triggerRestaurantPayout,
  getMerchantApplications,
  reviewMerchantApplication,
} from '../controllers/admin.js';
import adminAuth from '../middleware/adminAuth.js';
import validate, {
  adminLoginSchema,
  paginationSchema,
} from '../middleware/validate.js';

const router = express.Router();

router.post('/login', validate(adminLoginSchema), adminLogin);

router.get('/dashboard', adminAuth, getDashboardStats);
router.get('/users', adminAuth, validate(paginationSchema, 'query'), getAllUsers);
router.get('/rides', adminAuth, validate(paginationSchema, 'query'), getAllRides);
router.get('/kyc', adminAuth, validate(paginationSchema, 'query'), getKYCSubmissions);
router.get('/financials', adminAuth, getFinancials);
router.post('/restaurant-payouts', adminAuth, triggerRestaurantPayout);

router.get('/merchant-applications', adminAuth, validate(paginationSchema, 'query'), getMerchantApplications);
router.post('/merchant-applications/:applicationId/review', adminAuth, reviewMerchantApplication);

export default router;
