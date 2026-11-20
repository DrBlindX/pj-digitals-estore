import crypto from "crypto";
import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Shop from "../models/Shop.js";
import { razorpayConfigured } from "../utils/razorpay.js";
import { telegramConfigured } from "../utils/telegram.js";

/** Resolves with the MongoDB round-trip time in ms, or null if the database doesn't answer in 2s. */
const pingDb = async (): Promise<number | null> => {
  const db = mongoose.connection.db;
  if (mongoose.connection.readyState !== 1 || !db) return null;
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      db.admin().ping(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), 2000);
      }),
    ]);
    return Date.now() - started;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
};

/**
 * GET /health  (public, cheap, no auth)
 * 200 + {"success":true,...} only when the API AND the database answer.
 * 503 otherwise, so Uptime Kuma, Docker and the auto-deploy health check all see "down".
 */
export const health = async (_req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");
  const dbPingMs = await pingDb();
  if (dbPingMs === null) {
    return res.status(503).json({ success: false, db: "down", uptime: process.uptime() });
  }
  return res.json({ success: true, db: "up", dbPingMs, uptime: process.uptime() });
};

const tokenOk = (req: Request) => {
  const want = process.env.HEALTH_TOKEN?.trim();
  const got = req.header("x-health-token");
  if (!want || !got) return false;
  const a = Buffer.from(want);
  const b = Buffer.from(got);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/**
 * GET /health/details  (needs the header  x-health-token: <HEALTH_TOKEN>)
 * Numbers for Uptime Kuma "JSON Query" monitors. Without a valid token it answers 404,
 * exactly like an unknown route, so it does not advertise itself.
 */
export const healthDetails = async (req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");
  if (!tokenOk(req)) {
    return res
      .status(404)
      .json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
  }

  const dbPingMs = await pingDb();
  let business: Record<string, number> | null = null;
  if (dbPingMs !== null) {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [pendingShops, orders24h, paidButCancelled] = await Promise.all([
        Shop.countDocuments({ status: "pending" }),
        Order.countDocuments({ createdAt: { $gte: since } }),
        // money received for an order that was cancelled: an admin must refund it
        Order.countDocuments({ paymentStatus: "paid", orderStatus: "cancelled" }),
      ]);
      business = { pendingShops, orders24h, paidButCancelled };
    } catch (error: any) {
      console.error("health details query failed:", error?.message);
    }
  }

  const mem = process.memoryUsage();
  const ok = dbPingMs !== null;
  return res.status(ok ? 200 : 503).json({
    success: ok,
    uptimeSeconds: Math.round(process.uptime()),
    node: process.version,
    db: { up: ok, pingMs: dbPingMs },
    memoryMb: { rss: Math.round(mem.rss / 1048576), heapUsed: Math.round(mem.heapUsed / 1048576) },
    business,
    integrations: { razorpay: razorpayConfigured(), telegram: telegramConfigured() },
  });
};
