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

    const community = new Community({
      name,
      description,
      members: [{ userId: req.userId, role: 'admin' }] // creator as admin
    });
    await community.save();

    // Add community to user's communities
    await User.findByIdAndUpdate(req.userId, {
      $push: { communities: community._id }
    });

    res.status(201).json({
      id: community._id,
      name: community.name,
      description: community.description,
      members: [{ userId: req.userId, role: 'admin' }],
      createdAt: community.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create community', error: err });
  }
});

// Get communities for logged-in user, including member info
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    // Find communities the user belongs to
    const communities = await Community.find({ 'members.userId': req.userId });

    // Populate member usernames
    const populatedCommunities = await Promise.all(
      communities.map(async (community) => {
        const membersWithNames = await Promise.all(
          community.members.map(async (m) => {
            const user = await User.findById(m.userId).select('username email');
            return {
              userId: m.userId,
              role: m.role,
              username: user?.username || 'Unknown',
              email: user?.email || ''
            };
          })
        );

        return {
          id: community._id,
          name: community.name,
          description: community.description,
          members: membersWithNames,
          createdAt: community.createdAt,
          updatedAt: community.updatedAt
        };
      })
    );

    res.json(populatedCommunities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch communities', error: err });
  }
});

export default router;
