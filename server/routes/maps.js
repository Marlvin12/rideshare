import express from 'express';
import {
  reverseGeocodeLocation,
  getAutocompleteSuggestions,
  getLocationDetails,
  getRoute,
  snapRoadPoints,
  validateAddress,
} from '../controllers/maps.js';
import validate, {
  reverseGeocodeSchema,
  autocompleteSchema,
  placeDetailsSchema,
  routeSchema,
  snapToRoadSchema,
  addressValidationSchema,
} from '../middleware/validate.js';

const router = express.Router();

router.get('/reverse-geocode', validate(reverseGeocodeSchema, 'query'), reverseGeocodeLocation);
router.get('/autocomplete', validate(autocompleteSchema, 'query'), getAutocompleteSuggestions);
router.get('/place-details', validate(placeDetailsSchema, 'query'), getLocationDetails);
router.get('/route', validate(routeSchema, 'query'), getRoute);
router.post('/snap-to-road', validate(snapToRoadSchema), snapRoadPoints);
router.post('/address-validate', validate(addressValidationSchema), validateAddress);

export default router;
