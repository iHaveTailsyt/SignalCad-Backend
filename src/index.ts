import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import connectDB from './config/db.js';

import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import communityRoutes from './routes/communities.js';
import contactRoutes from './routes/contact.js';

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to log every request
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('---------------------------');
  console.log(`📝 Incoming Request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.method !== 'GET') {
    console.log('Body:', req.body);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/status', healthRoutes);
app.use('/api/contact', contactRoutes);

app.get('/', (req: Request, res: Response) => {
  console.log('📬 Root route accessed');
  res.send('🚀 SignalCAD Backend is running');
});

// Error-handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error processing request:', {
    method: req.method,
    url: req.url,
    body: req.body,
    message: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: 'Internal Server Error' });
});

const startServer = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

export default app;
