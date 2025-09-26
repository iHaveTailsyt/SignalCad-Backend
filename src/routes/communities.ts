import { Router } from 'express';
import Community from '../models/Community.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Create a new community
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    // Create community
    const community = new Community({
      name,
      description,
      members: [{ userId: req.userId, role: 'admin' }] // creator as admin by default
    });
    await community.save();

    // Add community to user's communities
    await User.findByIdAndUpdate(req.userId, {
      $push: { communities: community._id }
    });

    res.status(201).json(community);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create community', error: err });
  }
});

// Get communities for logged-in user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const communities = await Community.find({ 'members.userId': req.userId });
    res.json(communities);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch communities', error: err });
  }
});

export default router;
