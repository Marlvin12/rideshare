import express from 'express';
import { submitKYC, getKYCStatus, approveKYC, rejectKYC, getRiderEarnings } from '../controllers/kyc.js';
import { requestWithdrawal } from '../controllers/payout.js';
import auth from '../middleware/authentication.js';
import adminAuth from '../middleware/adminAuth.js';
import validate, { kycSubmitSchema, kycApproveSchema, kycRejectSchema, withdrawSchema } from '../middleware/validate.js';

const router = express.Router();

router.post('/submit', auth, validate(kycSubmitSchema), submitKYC);
router.get('/status', auth, getKYCStatus);
router.post('/approve', adminAuth, validate(kycApproveSchema), approveKYC);
router.post('/reject', adminAuth, validate(kycRejectSchema), rejectKYC);
router.get('/earnings', auth, getRiderEarnings);
router.post('/withdraw', auth, validate(withdrawSchema), requestWithdrawal);

export default router;
