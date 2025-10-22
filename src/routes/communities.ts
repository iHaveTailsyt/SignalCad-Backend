import { Router } from 'express';
import Community from '../models/Community.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Create a new community
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, description, primaryColor, logoUrl } = req.body;
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const community = new Community({
      name,
      description,
      branding: {
        primaryColor: primaryColor || '#4f46e5',
        logoUrl: logoUrl || ''
      },
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
      branding: community.branding,
      members: [{ userId: req.userId, role: 'admin' }],
      createdAt: community.createdAt
    });
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
          branding: community.branding,
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

// Get single community
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const community = await Community.findById(id);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    const currentUser = community.members.find(m => m.userId.toString() === userId.toString());
    const currentUserRole = currentUser?.role || 'none';

    const membersWithInfo = await Promise.all(
      community.members.map(async m => {
        const user = await User.findById(m.userId).select('username email');
        return {
          userId: m.userId,
          username: user?.username || 'Unknown',
          email: user?.email || '',
          role: m.role,
        };
      })
    );

    res.status(200).json({
      id: community._id,
      name: community.name,
      description: community.description,
      branding: community.branding,
      role: currentUserRole,
      members: membersWithInfo,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch community', error: err });
  }
});

// Update community branding (admin only)
router.patch('/:id/branding', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, primaryColor, logoUrl } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const community = await Community.findById(id);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    const currentUser = community.members.find(m => m.userId.toString() === userId.toString());
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    // Update branding and basic info
    if (name) community.name = name;
    if (description) community.description = description;
    community.branding = {
      ...community.branding,
      primaryColor: primaryColor || community.branding.primaryColor,
      logoUrl: logoUrl || community.branding.logoUrl
    };

    await community.save();

    res.status(200).json({
      id: community._id,
      name: community.name,
      description: community.description,
      branding: community.branding,
      updatedAt: community.updatedAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update branding', error: err });
  }
});

export default router;
