import { Request, Response } from "express";
import Order from "../models/Order.js";
import Delivery from "../models/Delivery.js";
import DeliveryPartner from "../models/DeliveryPartner.js";
import { HttpError, escapeRegex, sendError } from "../utils/http.js";
import { assignDelivery } from "../utils/deliveryHelpers.js";
import { notify } from "../utils/notify.js";
import { logActivity } from "../utils/activity.js";
import { getSettings } from "../utils/settings.js";

/** Admin controls this: a per-shop override wins, otherwise the platform-wide setting decides. */
export const shopMayAssignDrivers = async (shop: any) => {
  if (shop?.canAssignDrivers === true || shop?.canAssignDrivers === false) return shop.canAssignDrivers as boolean;
  return (await getSettings()).shopsCanAssignDrivers;
};

const requirePermission = async (req: Request) => {
  if (!(await shopMayAssignDrivers(req.shop))) {
    throw new HttpError(403, "Assigning delivery partners is handled by the store team for your shop.");
  }
};

// GET /api/shop/drivers?search=&available=true&all=true
// Delivery partners this shop can pick from. By default only those covering the shop's area.
export const listAssignableDrivers = async (req: Request, res: Response) => {
  try {
    await requirePermission(req);
    const query: any = { status: "approved" };
    if (req.query.available === "true") query.isAvailable = true;
    if (req.query.all !== "true") {
      query.$or = [{ serviceLocations: req.shop.location }, { serviceLocations: { $size: 0 } }];
    }
    if (req.query.search) {
      const rx = new RegExp(escapeRegex(String(req.query.search)), "i");
      query.$and = [{ $or: [{ fullName: rx }, { phone: rx }, { vehicleNumber: rx }] }];
    }
    const drivers: any[] = await DeliveryPartner.find(query)
      .select("fullName phone vehicleType vehicleNumber isAvailable serviceLocations photo completedDeliveries")
      .sort({ isAvailable: -1, fullName: 1 })
      .limit(100);

    const busy: any[] = await Delivery.aggregate([
      { $match: { driver: { $in: drivers.map((d) => d._id) }, status: { $in: ["assigned", "accepted", "picked_up", "on_the_way"] } } },
      { $group: { _id: "$driver", n: { $sum: 1 } } },
    ]);
    const jobs = new Map(busy.map((b) => [b._id.toString(), b.n]));
    res.json({
      success: true,
      data: drivers.map((d) => ({ ...d.toObject(), activeJobs: jobs.get(d._id.toString()) ?? 0 })),
    });
  } catch (error) {
    sendError(res, error, "Failed to fetch delivery partners");
  }
};

// POST /api/shop/orders/:id/assign   body: { driverId }   (assigns, or re-assigns before pickup)
export const assignOrderToDriver = async (req: Request, res: Response) => {
  try {
    await requirePermission(req);
    const order: any = await Order.findOne({ _id: req.params.id, shop: req.shop._id });
    if (!order) throw new HttpError(404, "Order not found");
    if (order.paymentMethod === "razorpay" && order.paymentStatus !== "paid") {
      throw new HttpError(400, "This online order hasn't been paid yet");
    }
    if (!req.body.driverId) throw new HttpError(400, "driverId is required");
    const delivery = await assignDelivery(order._id, req.body.driverId, req.user._id);
    await logActivity(req, "delivery.assigned_by_shop", "Delivery", delivery._id, { orderId: order._id, driverId: req.body.driverId });
    res.status(201).json({ success: true, data: delivery });
  } catch (error) {
    sendError(res, error, "Failed to assign delivery partner");
  }
};

// PUT /api/shop/orders/:id/unassign   (only while the driver hasn't picked the parcel up)
export const unassignOrder = async (req: Request, res: Response) => {
  try {
    await requirePermission(req);
    const order: any = await Order.findOne({ _id: req.params.id, shop: req.shop._id }).select("_id orderNumber");
    if (!order) throw new HttpError(404, "Order not found");
    const delivery: any = await Delivery.findOne({ order: order._id });
    if (!delivery) throw new HttpError(404, "No delivery partner is assigned");
    if (!["assigned", "accepted"].includes(delivery.status)) {
      throw new HttpError(400, `Can't unassign - delivery is ${delivery.status}`);
    }
    const driver: any = await DeliveryPartner.findById(delivery.driver).select("user");
    delivery.status = "cancelled";
    delivery.timeline.push({ status: "cancelled", at: new Date(), note: "Unassigned by shop" });
    await delivery.save();
    if (driver) {
      await notify(driver.user, { type: "delivery", title: "Delivery cancelled", body: `${order.orderNumber} was unassigned by the shop`, data: { deliveryId: delivery._id } });
    }
    await logActivity(req, "delivery.unassigned_by_shop", "Delivery", delivery._id, { orderId: order._id });
    res.json({ success: true, data: delivery });
  } catch (error) {
    sendError(res, error, "Failed to unassign");
  }
};
