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

export const applyPromo = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || typeof subtotal !== 'number') {
      return res.status(400).json({ success: false, msg: 'Code and subtotal required' });
    }

    const now = new Date();
    const promo = await PromoCode.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gt: now },
    });

    if (!promo) {
      return res.status(404).json({ success: false, msg: 'Promo code not found or expired' });
    }

    if (promo.maxRedemptions && promo.redemptionCount >= promo.maxRedemptions) {
      return res.status(400).json({ success: false, msg: 'This promo code has reached its limit' });
    }

    if (subtotal < promo.minOrderAmount) {
      return res.status(400).json({
        success: false,
        msg: `Minimum order of $${promo.minOrderAmount.toFixed(2)} required`,
      });
    }

    const userRedemptions = await PromoRedemption.countDocuments({
      userId: req.user.id,
      promoCodeId: promo._id,
    });
    if (userRedemptions >= promo.maxPerUser) {
      return res.status(400).json({ success: false, msg: 'You have already used this promo code' });
    }

    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = subtotal * (promo.discountValue / 100);
      if (promo.maxDiscount) {
        discount = Math.min(discount, promo.maxDiscount);
      }
    } else {
      discount = promo.discountValue;
    }
    discount = Math.min(discount, subtotal);
    discount = Math.round(discount * 100) / 100;

    res.status(200).json({
      success: true,
      discount,
      promoId: promo._id,
      code: promo.code,
      description: promo.description,
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

    await PromoRedemption.create({
      userId: req.user.id,
      promoCodeId: promo._id,
      code: promo.code,
      discountAmount,
      orderId: orderId || null,
    });

    promo.redemptionCount += 1;
    await promo.save();

    res.status(200).json({ success: true, msg: 'Promo redeemed' });
  } catch (error) {
    logger.error({ err: error }, 'redeemPromo failed');
    res.status(500).json({ success: false, msg: 'Failed to redeem promo' });
  }
};
