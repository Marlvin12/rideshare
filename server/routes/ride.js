import express from 'express';
import {
  createRide,
  updateRideStatus,
  acceptRide,
  getMyRides,
  getRideById,
  submitOffer,
  acceptOffer,
  getRideOffers,
  rateRide,
} from '../controllers/ride.js';
import validate, {
  createRideSchema,
  updateRideStatusSchema,
  submitOfferSchema,
  rateRideSchema,
  paginationSchema,
} from '../middleware/validate.js';
import cacheControl from '../middleware/cacheControl.js';

const router = express.Router();

router.post('/create', validate(createRideSchema), createRide);
router.get('/rides', validate(paginationSchema, 'query'), getMyRides);
router.get('/:rideId', cacheControl('no-store', 0), getRideById);
router.patch('/accept/:rideId', acceptRide);
router.patch('/update/:rideId', validate(updateRideStatusSchema), updateRideStatus);

router.post('/offer/:rideId', validate(submitOfferSchema), submitOffer);
router.patch('/offer/:rideId/:offerId/accept', acceptOffer);
router.get('/offers/:rideId', getRideOffers);

router.post('/rate/:rideId', validate(rateRideSchema), rateRide);

export default router;
