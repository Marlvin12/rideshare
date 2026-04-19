import logger from '../config/logger.js';
import TrustedContact from '../models/TrustedContact.js';
import User from '../models/User.js';
import BusinessProfile from '../models/BusinessProfile.js';

const MAX_CONTACTS = 5;

export const getTrustedContacts = async (req, res) => {
  try {
    const contacts = await TrustedContact.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, contacts });
  } catch (error) {
    logger.error({ err: error }, 'getTrustedContacts failed');
    res.status(500).json({ success: false, msg: 'Failed to load contacts' });
  }
};

export const addTrustedContact = async (req, res) => {
  try {
    const { name, phone, relation } = req.body;
    const count = await TrustedContact.countDocuments({ userId: req.user.id });
    if (count >= MAX_CONTACTS) {
      return res.status(400).json({ success: false, msg: `Maximum ${MAX_CONTACTS} trusted contacts allowed` });
    }
    const contact = await TrustedContact.create({
      userId: req.user.id,
      name: name.trim(),
      phone: phone.trim(),
      relation: relation?.trim() || undefined,
    });
    res.status(201).json({ success: true, contact });
  } catch (error) {
    logger.error({ err: error }, 'addTrustedContact failed');
    res.status(500).json({ success: false, msg: 'Failed to add contact' });
  }
};

export const deleteTrustedContact = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await TrustedContact.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!result) {
      return res.status(404).json({ success: false, msg: 'Contact not found' });
    }
    res.status(200).json({ success: true, msg: 'Contact removed' });
  } catch (error) {
    logger.error({ err: error }, 'deleteTrustedContact failed');
    res.status(500).json({ success: false, msg: 'Failed to remove contact' });
  }
};

export const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    const SAFE_FIELDS = ['name', 'email', 'whatsapp', 'gender', 'residencyType', 'profilePhoto', 'marketingOptOut'];
    const SAFE_NESTED = ['preferences'];

    for (const key of Object.keys(req.body)) {
      if (SAFE_FIELDS.includes(key)) {
        user[key] = req.body[key];
      }
      if (SAFE_NESTED.includes(key) && typeof req.body[key] === 'object') {
        user[key] = { ...(user[key] || {}), ...req.body[key] };
        user.markModified(key);
      }
    }

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (error) {
    logger.error({ err: error }, 'updateMe failed');
    res.status(500).json({ success: false, msg: 'Failed to update profile' });
  }
};

export const getBusinessProfile = async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ userId: req.user.id }).lean();
    res.status(200).json({ success: true, profile: profile || null });
  } catch (error) {
    logger.error({ err: error }, 'getBusinessProfile failed');
    res.status(500).json({ success: false, msg: 'Failed to load business profile' });
  }
};

export const upsertBusinessProfile = async (req, res) => {
  try {
    const { companyName, taxId, industry, billingEmail, billingAddress, useForOrders } = req.body;
    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ success: false, msg: 'Company name is required' });
    }
    const data = {
      companyName: companyName.trim(),
      taxId: taxId?.trim() || undefined,
      industry: industry?.trim() || undefined,
      billingEmail: billingEmail?.trim() || undefined,
      billingAddress: billingAddress?.trim() || undefined,
      useForOrders: !!useForOrders,
    };
    const profile = await BusinessProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: data, $setOnInsert: { userId: req.user.id } },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(200).json({ success: true, profile });
  } catch (error) {
    logger.error({ err: error }, 'upsertBusinessProfile failed');
    res.status(500).json({ success: false, msg: 'Failed to save business profile' });
  }
};

export const getMessageThreads = async (req, res) => {
  try {
    const ChatMessage = (await import('../models/ChatMessage.js')).default;
    const FoodOrder = (await import('../models/FoodOrder.js')).default;

    const userId = req.user.id;

    const recentOrderMessages = await ChatMessage.aggregate([
      { $match: { $or: [{ senderId: userId }, { recipientId: userId }], orderId: { $ne: null } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$orderId', lastMsg: { $first: '$text' }, lastTime: { $first: '$createdAt' }, recipientId: { $first: '$recipientId' }, senderId: { $first: '$senderId' } } },
      { $limit: 20 },
    ]);

    const threads = [];

    for (const msg of recentOrderMessages) {
      const order = await FoodOrder.findById(msg._id).select('orderNumber restaurantId').lean();
      threads.push({
        id: `order:${msg._id}`,
        type: 'order',
        title: order ? `Order #${order.orderNumber}` : 'Order chat',
        lastMessage: msg.lastMsg,
        timestamp: msg.lastTime,
        orderId: msg._id.toString(),
        recipientId: (msg.senderId.toString() === userId.toString() ? msg.recipientId : msg.senderId)?.toString(),
      });
    }

    threads.unshift({
      id: 'support',
      type: 'support',
      title: 'Loko Support',
      lastMessage: 'How can we help?',
    });

    res.status(200).json({ success: true, threads });
  } catch (error) {
    logger.error({ err: error }, 'getMessageThreads failed');
    res.status(500).json({ success: false, threads: [] });
  }
};
