import { Router, Request, Response } from 'express';
import ChatLead from '../models/ChatLead';

const router = Router();

// POST /api/v1/chat/lead
router.post('/lead', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, interests } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }
    const existing = await ChatLead.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(200).json({ success: true, skipped: true });
    }
    const lead = await ChatLead.create({ name, email, phone, interests: interests ?? [] });
    return res.status(201).json({ success: true, id: lead._id });
  } catch (err) {
    console.error('ChatLead save error:', err);
    return res.status(500).json({ error: 'Failed to save.' });
  }
});

export default router;
