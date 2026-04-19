import { z } from 'zod';
import { BadRequestError } from '../errors/index.js';

const sanitizeString = (val) =>
  typeof val === 'string'
    ? val.replace(/[<>]/g, '').trim()
    : val;

const safeString = (opts = {}) => {
  let s = z.string().transform(sanitizeString);
  if (opts.min) s = s.pipe(z.string().min(opts.min, opts.minMsg));
  if (opts.max) s = s.pipe(z.string().max(opts.max, opts.maxMsg));
  return s;
};

const mongoId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format');
const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);
const positiveInt = z.number().int().positive();
const positiveNumber = z.number().positive();

const locationObj = z.object({
  address: safeString({ min: 1, minMsg: 'Address required' }),
  latitude,
  longitude,
  instructions: safeString().optional(),
});

export const authSigninSchema = z.object({
  phone: safeString({ min: 1, minMsg: 'Phone is required', max: 20, maxMsg: 'Phone too long' }),
  role: z.enum(['customer', 'rider', 'merchant'], { required_error: 'Valid role required' }),
});

export const authRefreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token required'),
});

export const authFirebaseSchema = z.object({
  firebaseToken: z.string().min(1, 'Firebase token required'),
  role: z.enum(['customer', 'rider', 'merchant'], { required_error: 'Valid role required' }),
  uid: z.string().min(1, 'UID required'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const authProfileUpdateSchema = z.object({
  firstName: safeString({ min: 1, minMsg: 'First name required', max: 80, maxMsg: 'First name too long' }),
  lastName: safeString({ min: 1, minMsg: 'Last name required', max: 80, maxMsg: 'Last name too long' }),
  whatsapp: z
    .string()
    .max(30, 'WhatsApp number too long')
    .transform((s) => (typeof s === 'string' ? s.replace(/[^\d+]/g, '').slice(0, 24) : '')),
  gender: z.enum(['male', 'female']).optional(),
  residencyType: z.enum(['resident', 'visitor']).optional(),
  marketingOptOut: z.boolean().optional(),
});

export const kycSubmitSchema = z.object({
  idType: z.enum(['national_id', 'passport', 'drivers_license'], { required_error: 'Valid ID type required' }),
  idNumber: safeString({ min: 1, minMsg: 'ID number required', max: 50, maxMsg: 'ID number too long' }),
  fullName: safeString({ min: 1, minMsg: 'Full name required', max: 200, maxMsg: 'Name too long' }),
  dateOfBirth: z.string().min(1, 'Date of birth required'),
  address: safeString({ min: 1, minMsg: 'Address required', max: 500, maxMsg: 'Address too long' }),
  idFrontImage: z.string().min(1, 'ID front image required'),
  idBackImage: z.string().optional(),
});

export const kycApproveSchema = z.object({
  userId: mongoId,
});

export const kycRejectSchema = z.object({
  userId: mongoId,
  reason: safeString({ min: 1, minMsg: 'Rejection reason required', max: 500, maxMsg: 'Reason too long' }),
});

export const createRideSchema = z.object({
  vehicle: z.enum(['bike', 'human', 'cabEconomy', 'cabPremium']),
  pickup: z.object({
    address: safeString({ min: 1, minMsg: 'Pickup address required' }),
    latitude,
    longitude,
  }),
  drop: z.object({
    address: safeString({ min: 1, minMsg: 'Drop address required' }),
    latitude,
    longitude,
  }),
  proposedPrice: positiveNumber.optional(),
  suggestedPriceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
  pricingModel: z.enum(['fixed', 'bidding']).default('bidding'),
});

export const updateRideStatusSchema = z.object({
  status: z.enum(['START', 'ARRIVED', 'COMPLETED']),
});

export const submitOfferSchema = z.object({
  offeredPrice: positiveNumber,
  message: safeString({ max: 500, maxMsg: 'Message too long' }).optional(),
});

export const rateRideSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: safeString({ max: 1000, maxMsg: 'Feedback too long' }).optional(),
});

const orderItemsArray = z.array(z.object({
  menuItemId: z.string().min(1, 'Menu item ID required'),
  name: safeString().optional(),
  price: z.number().min(0).optional(),
  quantity: positiveInt,
  customizations: z.record(z.unknown()).optional(),
  specialInstructions: safeString({ max: 500, maxMsg: 'Instructions too long' }).optional(),
})).min(1, 'At least one item required');

const orderBaseSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant ID required'),
  items: orderItemsArray,
  deliveryAddress: locationObj,
  paymentMethod: z.enum(['cash', 'card', 'mobile_money']).default('cash'),
  channel: z.enum(['app', 'whatsapp', 'web']).default('app'),
  unavailableItemPreference: z
    .enum(['merchant_recommend', 'refund', 'contact_me', 'cancel_order'])
    .optional(),
});

export const createOrderSchema = orderBaseSchema.extend({
  idempotencyKey: safeString({ max: 255, maxMsg: 'Idempotency key too long' }).optional(),
});

export const validateOrderSchema = orderBaseSchema;

export const acceptOrderSchema = z.object({
  preparationTime: positiveInt.optional(),
});

export const rejectOrderSchema = z.object({
  reason: safeString({ min: 1, minMsg: 'Reason required', max: 500, maxMsg: 'Reason too long' }).optional(),
});

export const placeBidSchema = z.object({
  amount: positiveNumber,
  estimatedTime: positiveInt.optional(),
  message: safeString({ max: 500, maxMsg: 'Message too long' }).optional(),
});

export const acceptBidSchema = z.object({
  courierId: mongoId,
});

export const cancelOrderSchema = z.object({
  reason: safeString({ min: 1, minMsg: 'Cancellation reason required', max: 500, maxMsg: 'Reason too long' }),
});

export const itemUnavailableSchema = z.object({
  menuItemId: mongoId,
});

export const rateOrderSchema = z.object({
  restaurantRating: z.object({
    score: z.number().int().min(1).max(5),
    comment: safeString({ max: 1000, maxMsg: 'Comment too long' }).optional(),
  }).optional(),
  courierRating: z.object({
    score: z.number().int().min(1).max(5),
    comment: safeString({ max: 1000, maxMsg: 'Comment too long' }).optional(),
  }).optional(),
});

export const courierLocationSchema = z.object({
  latitude,
  longitude,
  heading: z.number().min(0).max(360).optional(),
});

export const deliveryProofSchema = z.object({
  deliveryProofImage: z.string().optional(),
});

export const createRestaurantSchema = z.object({
  name: safeString({ min: 1, minMsg: 'Name required', max: 200, maxMsg: 'Name too long' }),
  description: safeString({ max: 1000, maxMsg: 'Description too long' }).optional(),
  cuisine: z.array(safeString()).min(1, 'At least one cuisine required'),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  deliveryFee: z.number().min(0).optional(),
  minimumOrder: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  location: z.object({
    address: safeString({ min: 1, minMsg: 'Address required' }),
    latitude,
    longitude,
  }),
  contactPhone: safeString({ max: 20, maxMsg: 'Phone too long' }).optional(),
  preparationTime: positiveInt.optional(),
});

export const addMenuItemSchema = z.object({
  name: safeString({ min: 1, minMsg: 'Name required', max: 200, maxMsg: 'Name too long' }),
  description: safeString({ max: 1000, maxMsg: 'Description too long' }).optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  category: safeString({ min: 1, minMsg: 'Category required', max: 100, maxMsg: 'Category too long' }),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  preparationTime: positiveInt.optional(),
});

export const reverseGeocodeSchema = z.object({
  latitude: z.string().regex(/^-?\d+\.?\d*$/, 'Invalid latitude'),
  longitude: z.string().regex(/^-?\d+\.?\d*$/, 'Invalid longitude'),
});

export const autocompleteSchema = z.object({
  query: safeString({ min: 1, minMsg: 'Query required', max: 200, maxMsg: 'Query too long' }),
  latitude: z.string().regex(/^-?\d+\.?\d*$/).optional(),
  longitude: z.string().regex(/^-?\d+\.?\d*$/).optional(),
});

export const placeDetailsSchema = z.object({
  placeId: z.string().min(1, 'Place ID required'),
});

export const routeSchema = z.object({
  originLat: z.string().regex(/^-?\d+\.?\d*$/, 'Invalid origin latitude'),
  originLng: z.string().regex(/^-?\d+\.?\d*$/, 'Invalid origin longitude'),
  destinationLat: z.string().regex(/^-?\d+\.?\d*$/, 'Invalid destination latitude'),
  destinationLng: z.string().regex(/^-?\d+\.?\d*$/, 'Invalid destination longitude'),
  mode: z.enum(['DRIVE', 'BICYCLE', 'WALK', 'TWO_WHEELER']).optional(),
});

export const snapToRoadSchema = z.object({
  interpolate: z.boolean().optional(),
  points: z
    .array(
      z.object({
        latitude,
        longitude,
      })
    )
    .min(1, 'At least one point is required')
    .max(100, 'Too many points'),
});

export const addressValidationSchema = z.object({
  regionCode: z.string().length(2, 'Region code must be ISO-2').optional(),
  locality: safeString({ max: 200, maxMsg: 'Locality too long' }).optional(),
  administrativeArea: safeString({ max: 200, maxMsg: 'Administrative area too long' }).optional(),
  postalCode: safeString({ max: 20, maxMsg: 'Postal code too long' }).optional(),
  addressLines: z
    .array(safeString({ min: 1, minMsg: 'Address line required', max: 300, maxMsg: 'Address line too long' }))
    .min(1, 'At least one address line is required')
    .max(5, 'Too many address lines'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

export const withdrawSchema = z.object({
  amount: positiveNumber,
  method: z.enum(['ecocash', 'onemoney', 'bank']).optional(),
  destination: safeString({ max: 50, maxMsg: 'Destination too long' }).optional(),
  saveDestination: z.boolean().optional(),
});

export const paginationSchema = z
  .object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  })
  .passthrough();

const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const data = source === 'query' ? req.query : req.body;
    const result = schema.safeParse(data);
    if (!result.success) {
      const msg = result.error.errors.map((e) => e.message).join(', ');
      throw new BadRequestError(msg);
    }
    if (source === 'query') {
      req.query = { ...req.query, ...result.data };
    } else {
      req.body = result.data;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default validate;
