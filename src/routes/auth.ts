import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Helper to log errors
const logError = (err: unknown, route: string, body: any) => {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('❌ Error in route:', route);
  console.error('Request body:', body);
  console.error(error.stack);
};

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log('🔔 Signup attempt:', { username, email });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, email, passwordHash });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || '',
      { expiresIn: '1h' }
    );

    console.log('✅ Signup successful:', email);
    res.status(201).json({ token, user: { id: user._id, username, email } });
  } catch (err: unknown) {
    logError(err, '/signup', req.body);
    const error = err instanceof Error ? err : new Error(String(err));
    res.status(500).json({
      message: 'Server error',
      error: { message: error.message, stack: error.stack },
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔔 Login attempt:', { email });

    const user = await User.findOne({ email });
    if (!user) {
      console.log('⚠️ User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Use comparePassword if exists, otherwise bcrypt.compare
    const isMatch = user.comparePassword
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      console.log('⚠️ Password mismatch for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || '',
      { expiresIn: '1h' }
    );

    console.log('✅ Login successful:', email);
    res.status(200).json({ token, user: { id: user._id, username: user.username, email } });
  } catch (err: unknown) {
    logError(err, '/login', req.body);
    const error = err instanceof Error ? err : new Error(String(err));
    res.status(500).json({
      message: 'Server error',
      error: { message: error.message, stack: error.stack },
    });
  }
});

export default router;
