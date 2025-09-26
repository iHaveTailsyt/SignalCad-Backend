import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get('/', async(require, res) => {
    // check db status
    let dbStatus: string;
    switch (mongoose.connection.readyState) {
        case 0: dbStatus = 'disconnected'; break;
        case 1: dbStatus = 'connected'; break;
        case 2: dbStatus = 'connecting'; break;
        case 3: dbStatus = 'disconnecting'; break;
        default: dbStatus = 'unknown';
    }

    res.json({
        status: 'ok',
        uptime: process.uptime(), // Seconds since process started
        timestamp: new Date().toISOString(),
        db: dbStatus
    });
});

export default router;