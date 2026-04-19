import express from 'express';
import authMiddleware from '../middleware/authentication.js';
import {
  getTrustedContacts,
  addTrustedContact,
  deleteTrustedContact,
  updateMe,
  getBusinessProfile,
  upsertBusinessProfile,
  getMessageThreads,
} from '../controllers/customer.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/safety/contacts', getTrustedContacts);
router.post('/safety/contacts', addTrustedContact);
router.delete('/safety/contacts/:id', deleteTrustedContact);

router.patch('/me', updateMe);

router.get('/business-profile', getBusinessProfile);
router.put('/business-profile', upsertBusinessProfile);
router.get('/messages/threads', getMessageThreads);

export default router;
