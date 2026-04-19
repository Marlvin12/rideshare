import express from 'express';
import { createRiderLead } from '../controllers/onboarding.js';

const router = express.Router();

router.post('/rider-lead', createRiderLead);

export default router;

