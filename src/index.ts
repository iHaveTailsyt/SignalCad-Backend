import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import communityRoutes from './routes/communities.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/health', healthRoutes);

app.get('/', (req, res) => {
  res.send('🚀 SignalCAD Backend is running');
});

const startServer = async () => {
  try {
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
