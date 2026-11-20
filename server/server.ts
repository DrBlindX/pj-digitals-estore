import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { clerkWebhook } from "./controllers/webhooks.js";
import makeAdmin from "./scripts/makeAdmin.js";
import ProductRouter from "./routes/productsRoutes.js";
import CartRouter from "./routes/cartRoutes.js";
import OrderRouter from "./routes/ordersRoute.js";
import AddressRouter from "./routes/addressRoutes.js";
import AdminRouter from "./routes/adminRoutes.js";
import DealerRouter from "./routes/dealerRoutes.js";
import WishlistRouter from "./routes/wishlistRoutes.js";
import { ShopDirectoryRouter, ShopOwnerRouter } from "./routes/shopRoutes.js";
import DeliveryRouter from "./routes/deliveryRoutes.js";
import PaymentRouter from "./routes/paymentRoutes.js";
import { razorpayWebhook } from "./controllers/paymentController.js";
import {
  MeRouter,
  MetaRouter,
  NotificationRouter,
  PublicAdsRouter,
  SupportRouter,
} from "./routes/miscRoutes.js";
import { errorHandler, notFound } from "./middleware/validate.js";
import { health, healthDetails } from "./controllers/healthController.js";
import { alertOps, errorText, escapeHtml, sendTelegram } from "./utils/telegram.js";

// A crash is restarted by Docker; tell the owner first (Telegram is a no-op when not configured).
process.on("unhandledRejection", async (reason: any) => {
  console.error("Unhandled rejection:", reason);
  await sendTelegram(`🔴 <b>API crashed</b> (unhandled rejection, restarting)\n<code>${errorText(reason)}</code>`, { key: "crash", cooldownMs: 60_000 });
  process.exit(1);
});
process.on("uncaughtException", async (error: any) => {
  console.error("Uncaught exception:", error);
  await sendTelegram(`🔴 <b>API crashed</b> (uncaught exception, restarting)\n<code>${errorText(error)}</code>`, { key: "crash", cooldownMs: 60_000 });
  process.exit(1);
});

const app = express();
app.set("trust proxy", 1); // behind Vercel / a load balancer

await connectDB();

// Webhooks need the RAW body for signature verification, so they must be
// registered BEFORE express.json().
app.post("/api/clerk", express.raw({ type: "application/json" }), clerkWebhook);
app.post("/api/razorpay/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

// CORS: set CLIENT_URL (comma separated) in production, open in development
const allowedOrigins = process.env.CLIENT_URL?.split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins?.length ? { origin: allowedOrigins, credentials: true } : undefined));

// Status endpoints are registered BEFORE clerkMiddleware(). With Clerk development keys, Clerk
// redirects browser-like requests (uptime monitors, link checkers) to its handshake URL, which
// makes a healthy server look broken.
app.get("/", (_req: Request, res: Response) => {
  res.send("Server is Live!");
});
app.get("/health", health); // 200 only if the API and MongoDB both answer, else 503
app.get("/health/details", healthDetails); // needs header x-health-token (HEALTH_TOKEN)

app.use(express.json({ limit: "1mb" }));
app.use(clerkMiddleware());

const port = process.env.PORT || 3000;

app.use("/api/products", ProductRouter);
app.use("/api/cart", CartRouter);
app.use("/api/orders", OrderRouter);
app.use("/api/payments", PaymentRouter);
app.use("/api/address", AddressRouter);
app.use("/api/wishlist", WishlistRouter);
app.use("/api/shops", ShopDirectoryRouter);
app.use("/api/shop", ShopOwnerRouter);
app.use("/api/delivery", DeliveryRouter);
app.use("/api/ads", PublicAdsRouter);
app.use("/api/notifications", NotificationRouter);
app.use("/api/support", SupportRouter);
app.use("/api/me", MeRouter);
app.use("/api/meta", MetaRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/dealer", DealerRouter);

app.use(notFound);
app.use(errorHandler);

await makeAdmin();

// On Vercel the platform invokes the exported app; only listen locally.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    alertOps(`🟢 API started (${escapeHtml(process.env.NODE_ENV || "development")})`, { key: "boot", cooldownMs: 30_000 });
  });
}

export default app;
