import logger from '../config/logger.js';
import PromoCode from '../models/PromoCode.js';
import PromoRedemption from '../models/PromoRedemption.js';

export const getActivePromos = async (req, res) => {
  try {
    const now = new Date();
    const promos = await PromoCode.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gt: now },
      $or: [
        { maxRedemptions: null },
        { $expr: { $lt: ['$redemptionCount', '$maxRedemptions'] } },
      ],
    })
      .select('code description discountType discountValue minOrderAmount maxDiscount validUntil')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({ success: true, promos });
  } catch (error) {
    logger.error({ err: error }, 'getActivePromos failed');
    res.status(500).json({ success: false, msg: 'Failed to load promotions' });
  }
};

// Pure discount math: percentage (optionally capped at maxDiscount) or fixed,
// never more than the subtotal, rounded to 2dp. Extracted so it can be unit
// tested and reused by both /apply (preview) and order creation (authoritative).
export const computePromoDiscount = (promo, subtotal) => {
  const sub = Math.max(0, Number(subtotal) || 0);
  let discount;
  if (promo.discountType === 'percentage') {
    discount = sub * (Number(promo.discountValue) / 100);
    if (promo.maxDiscount) discount = Math.min(discount, Number(promo.maxDiscount));
  } else {
    discount = Number(promo.discountValue);
  }
  discount = Math.min(discount, sub);
  return Math.round(Math.max(0, discount) * 100) / 100;
};

// Validate a promo for a user against an order subtotal and compute the discount.
// HTTP-free + reused by POST /apply (preview) AND order creation (authoritative
// bind) so a customer can never be charged a discount the server didn't compute
// from the real subtotal (BE-24). Returns a discriminated result.
export const evaluatePromo = async ({ code, subtotal, userId }) => {
  if (!code || typeof subtotal !== 'number') {
    return { ok: false, status: 400, msg: 'Code and subtotal required' };
  }
  const now = new Date();
  const promo = await PromoCode.findOne({
    code: String(code).trim().toUpperCase(),
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gt: now },
  });
  if (!promo) return { ok: false, status: 404, msg: 'Promo code not found or expired' };
  if (promo.maxRedemptions && promo.redemptionCount >= promo.maxRedemptions) {
    return { ok: false, status: 400, msg: 'This promo code has reached its limit' };
  }
  if (subtotal < promo.minOrderAmount) {
    return { ok: false, status: 400, msg: `Minimum order of $${promo.minOrderAmount.toFixed(2)} required` };
  }
  const userRedemptions = await PromoRedemption.countDocuments({ userId, promoCodeId: promo._id });
  if (userRedemptions >= promo.maxPerUser) {
    return { ok: false, status: 400, msg: 'You have already used this promo code' };
  }
  return {
    ok: true,
    discount: computePromoDiscount(promo, subtotal),
    promo,
    promoId: promo._id,
    code: promo.code,
    description: promo.description,
  };
};

// Record a redemption + bump the count atomically ($inc, not read-modify-save).
// Called best-effort from order creation AFTER the order is saved, so a failed
// record can't fail the order (the discount is already applied + persisted).
export const recordRedemption = async ({ promo, userId, discountAmount, orderId }) => {
  await PromoRedemption.create({
    userId,
    promoCodeId: promo._id,
    code: promo.code,
    discountAmount,
    orderId: orderId || null,
  });
  await PromoCode.updateOne({ _id: promo._id }, { $inc: { redemptionCount: 1 } });
};

export const applyPromo = async (req, res) => {
  try {
    const result = await evaluatePromo({ code: req.body.code, subtotal: req.body.subtotal, userId: req.user.id });
    if (!result.ok) return res.status(result.status).json({ success: false, msg: result.msg });
    res.status(200).json({
      success: true,
      discount: result.discount,
      promoId: result.promoId,
      code: result.code,
      description: result.description,
    });
  } catch (error) {
    logger.error({ err: error }, 'applyPromo failed');
    res.status(500).json({ success: false, msg: 'Failed to apply promo' });
  }
};

export const redeemPromo = async (req, res) => {
  try {
    const { promoId, discountAmount, orderId } = req.body;
    if (!promoId || !discountAmount) {
      return res.status(400).json({ success: false, msg: 'Promo ID and discount required' });
    }
    const promo = await PromoCode.findById(promoId);
    if (!promo) {
      return res.status(404).json({ success: false, msg: 'Promo not found' });
    }
    await recordRedemption({ promo, userId: req.user.id, discountAmount, orderId });
    res.status(200).json({ success: true, msg: 'Promo redeemed' });
  } catch (error) {
    logger.error({ err: error }, 'redeemPromo failed');
    res.status(500).json({ success: false, msg: 'Failed to redeem promo' });
  }
};
