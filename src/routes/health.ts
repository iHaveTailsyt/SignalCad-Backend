import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import os from "os";
import axios from "axios";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const startTime = Date.now();

  // --- DATABASE STATUS ---
  let dbStatus = "unknown";
  let dbPing: number | null = null;

  try {
    switch (mongoose.connection.readyState) {
      case 0:
        dbStatus = "disconnected";
        break;
      case 1:
        dbStatus = "connected";
        if (mongoose.connection.db) {
          const start = performance.now();
          await mongoose.connection.db.admin().ping();
          dbPing = performance.now() - start;
        }
        break;
      case 2:
        dbStatus = "connecting";
        break;
      case 3:
        dbStatus = "disconnecting";
        break;
      default:
        dbStatus = "unknown";
    }
  } catch {
    dbStatus = "error";
  }

  // --- SERVICE CHECKS ---
  const services = [
    { name: "API", url: "http://localhost:3000/" },
    { name: "Auth Service", url: "http://localhost:3000/" },
  ];

  const serviceStatuses = await Promise.all(
    services.map(async (svc) => {
      const started = Date.now();
      try {
        const resp = await axios.get(svc.url, { timeout: 100 });
        return {
          name: svc.name,
          url: svc.url,
          status: resp.status === 200 ? "up" : "degraded",
          latencyMs: Date.now() - started,
        };
      } catch {
        return {
          name: svc.name,
          url: svc.url,
          status: "down",
          latencyMs: Date.now() - started,
        };
      }
    })
  );

  // --- SYSTEM INFO (safe public summary) ---
  const totalMem = os.totalmem() / 1024 / 1024;
  const freeMem = os.freemem() / 1024 / 1024;
  const usedMem = totalMem - freeMem;

  const system = {
    hostname: "SignalCAD Main Server", // ✅ Hardcoded public-safe name
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    pid: process.pid,
    uptime: {
      seconds: process.uptime(),
      human: `${Math.floor(process.uptime() / 3600)}h ${Math.floor(
        (process.uptime() % 3600) / 60
      )}m ${Math.floor(process.uptime() % 60)}s`,
    },
    cpu: {
      model: os.cpus()[0]?.model || "Unknown",
      cores: os.cpus().length,
      loadAvg: {
        "1min": os.loadavg()[0].toFixed(2),
        "5min": os.loadavg()[1].toFixed(2),
        "15min": os.loadavg()[2].toFixed(2),
      },
    },
    memory: {
      totalMB: totalMem.toFixed(1),
      freeMB: freeMem.toFixed(1),
      usedMB: usedMem.toFixed(1),
      processRSS: (process.memoryUsage().rss / 1024 / 1024).toFixed(1),
      processHeapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),
    },
  };

  // --- FINAL STATUS ---
  const overallStatus = [
    dbStatus,
    ...serviceStatuses.map((s) => s.status),
  ].every((s) => s === "connected" || s === "up")
    ? "operational"
    : "issues";

  res.status(200).json({
    status: overallStatus,
    checkedAt: new Date().toISOString(),
    responseTime: `${Date.now() - startTime}ms`,
    database: { status: dbStatus, pingMs: dbPing },
    services: serviceStatuses,
    system,
  });
});

export default router;
