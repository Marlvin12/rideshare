import express from 'express';
import rateLimit from 'express-rate-limit';
import { refreshToken, auth, firebaseAuth, updateProfile } from '../controllers/auth.js';
import authenticateUser from '../middleware/authentication.js';
import validate, {
  authSigninSchema,
  authRefreshSchema,
  authFirebaseSchema,
  authProfileUpdateSchema,
} from '../middleware/validate.js';

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { msg: 'Too many authentication attempts, try again in a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.post('/refresh-token', authLimiter, validate(authRefreshSchema), refreshToken);
router.post('/signin', authLimiter, validate(authSigninSchema), auth);
router.post('/firebase-signin', authLimiter, validate(authFirebaseSchema), firebaseAuth);
router.patch(
  '/profile',
  authenticateUser,
  validate(authProfileUpdateSchema),
  updateProfile
);

export default router;
