import express from 'express';
import authMiddleware from '../middleware/authentication.js';
import { getActivePromos, applyPromo, redeemPromo } from '../controllers/promotions.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getActivePromos);
router.post('/apply', applyPromo);
router.post('/redeem', redeemPromo);

export default router;
