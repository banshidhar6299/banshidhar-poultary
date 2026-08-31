import { Request, Response } from 'express';
import { Order, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { Farmer } from '../models/Farmer';
import { Notification } from '../models/Notification';
import { LedgerTransaction } from '../models/LedgerTransaction';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest, OrderStatus } from '../types';
import { emitNotification, emitOrderUpdate } from '../services/socketService';
import { sendPushToUser, sendPushToRole } from '../services/pushService';
import { generateOrderId } from '../utils/sequence';
import { logger } from '../utils/logger';

// Farmer / Admin: Create Order
export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { items, notes, targetFarmerId } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
      return;
    }

    // Determine target farmer
    let farmerDoc: any = null;
    let createdByRole: 'FARMER' | 'ADMIN' = 'FARMER';

    if (user.role === 'ADMIN') {
      createdByRole = 'ADMIN';
      if (!targetFarmerId) {
        res.status(400).json({ success: false, message: 'Admin must specify targetFarmerId.' });
        return;
      }
      farmerDoc = await Farmer.findById(targetFarmerId);
    } else {
      farmerDoc = await Farmer.findById(user.userId);
    }

    if (!farmerDoc) {
      res.status(404).json({ success: false, message: 'Farmer record not found.' });
      return;
    }

    // Fetch products and lock price snapshots
    let totalAmount = 0;
    const orderItems: IOrderItem[] = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        res.status(400).json({ success: false, message: `Product ${item.productId} not found.` });
        return;
      }

      const qty = Number(item.quantity);
      if (!qty || qty < 1) {
        res.status(400).json({ success: false, message: `Invalid quantity for product ${product.name}.` });
        return;
      }

      // Snapshot unit price from DB at order creation time
      const unitPrice = product.price;
      const itemTotal = unitPrice * qty;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id as any,
        productName: product.name,
        productNameHi: product.nameHi,
        unitPrice,
        quantity: qty,
        unit: product.unit,
        totalPrice: itemTotal,
        imageUrl: product.imageUrl
      });
    }

    const orderId = await generateOrderId();
    const order = await Order.create({
      orderId,
      farmerId: farmerDoc._id,
      farmerName: farmerDoc.name,
      items: orderItems,
      totalAmount,
      status: 'PENDING',
      notes,
      createdBy: createdByRole,
      statusHistory: [
        {
          status: 'PENDING',
          changedAt: new Date(),
          changedBy: user.name,
          note: createdByRole === 'ADMIN' ? 'Order created directly by Admin' : 'Order placed by Farmer'
        }
      ]
    });

    // Notifications
    if (createdByRole === 'ADMIN') {
      const farmerNotification = await Notification.create({
        recipientRole: 'FARMER',
        recipientId: farmerDoc._id,
        type: 'NEW_ORDER',
        title: 'New Order Added by Banshidhar Poultry',
        titleHi: 'बंशीधर पोल्ट्री द्वारा नया ऑर्डर जोड़ा गया',
        message: `Banshidhar Poultry created order #${orderId} (₹${totalAmount}) for your account.`,
        messageHi: `बंशीधर पोल्ट्री ने आपके खाते में नया ऑर्डर #${orderId} (₹${totalAmount}) जोड़ा है।`,
        deepLink: `/farmer/orders/${order._id}`,
        metadata: { orderId: order._id }
      });
      emitNotification(farmerNotification);

      // Push to Farmer in Hindi
      sendPushToUser(String(farmerDoc._id), {
        title: '📦 नया ऑर्डर दर्ज हुआ',
        body: `डीलरशिप द्वारा आपके खाते में नया ऑर्डर #${orderId} (₹${totalAmount}) दर्ज किया गया।`,
        url: `/farmer/orders/${order._id}`,
        tag: `order-${order._id}`
      }).catch((err) => console.error('Push error:', err));
    } else {
      const adminNotification = await Notification.create({
        recipientRole: 'ADMIN',
        type: 'NEW_ORDER',
        title: `New Order from ${farmerDoc.name}`,
        titleHi: `${farmerDoc.name} से नया ऑर्डर`,
        message: `Farmer ${farmerDoc.name} placed order #${orderId} for ₹${totalAmount}.`,
        messageHi: `किसान ${farmerDoc.name} ने ₹${totalAmount} का नया ऑर्डर #${orderId} दिया है।`,
        deepLink: `/admin/orders`,
        metadata: { orderId: order._id, farmerId: farmerDoc._id }
      });
      emitNotification(adminNotification);

      // Push to Admin in Hindi
      sendPushToRole('ADMIN', {
        title: `📦 नया ऑर्डर: ${farmerDoc.name}`,
        body: `किसान ${farmerDoc.name} ने ₹${totalAmount} का नया ऑर्डर #${orderId} दिया है।`,
        url: `/admin/orders`,
        tag: `order-${order._id}`
      }).catch((err) => console.error('Push error:', err));
    }

    emitOrderUpdate(order);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error: any) {
    logger.error("Order", "Request error", error);
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Get Orders (Admin gets all, Farmer gets own)
export const getOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { status, farmerId, search, page = 1, limit = 20 } = req.query;
    const filter: any = {};

    if (user.role === 'FARMER') {
      filter.farmerId = user.userId;
    } else {
      if (farmerId) filter.farmerId = farmerId;
      if (status && status !== 'ALL') filter.status = status;
      if (search) {
        const regex = new RegExp(String(search).trim(), 'i');
        filter.$or = [{ orderId: regex }, { farmerName: regex }];
      }
    }

    if (status && status !== 'ALL') filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    logger.error("Order", "Request error", error);
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Get Single Order
export const getOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (user?.role === 'FARMER' && order.farmerId.toString() !== user.userId) {
      res.status(403).json({ success: false, message: 'Access denied to this order.' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    logger.error("Order", "Request error", error);
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// Admin: Update Order Status
export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note, postToLedger = true } = req.body as {
      status: OrderStatus;
      note?: string;
      postToLedger?: boolean;
    };
    const user = req.user;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const previousStatus = order.status;
    order.status = status;

    if (status === 'CONFIRMED') order.confirmedAt = new Date();
    if (status === 'DELIVERED') order.deliveredAt = new Date();
    if (status === 'CANCELLED') order.cancelledAt = new Date();

    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: user?.name || 'Admin',
      note: note || `Status changed from ${previousStatus} to ${status}`
    });

    await order.save();

    // If delivered and postToLedger is true, post product debit to ledger
    if (status === 'DELIVERED' && postToLedger && previousStatus !== 'DELIVERED') {
      const itemsDescription = order.items
        .map((it) => `${it.quantity}x ${it.productName}`)
        .join(', ');

      await LedgerTransaction.create({
        farmerId: order.farmerId,
        farmerName: order.farmerName,
        transactionDate: new Date(),
        transactionType: 'PRODUCT_PURCHASE',
        description: `Order #${order.orderId}: ${itemsDescription}`,
        descriptionHi: `ऑर्डर #${order.orderId}: ${itemsDescription}`,
        debit: order.totalAmount,
        credit: 0,
        referenceId: order.orderId,
        referenceType: 'ORDER',
        createdBy: user?.name || 'ADMIN'
      });
    }

    // Notify Farmer
    const statusTitles: Record<OrderStatus, { en: string; hi: string }> = {
      PENDING: { en: 'Order Pending', hi: 'ऑर्डर लंबित' },
      CONFIRMED: { en: 'Order Confirmed', hi: 'ऑर्डर कन्फर्म हो गया' },
      DELIVERED: { en: 'Order Delivered', hi: 'ऑर्डर डिलीवर हो गया' },
      CANCELLED: { en: 'Order Cancelled', hi: 'ऑर्डर रद्द कर दिया गया' }
    };

    const notif = await Notification.create({
      recipientRole: 'FARMER',
      recipientId: order.farmerId,
      type: 'ORDER_STATUS_CHANGED',
      title: statusTitles[status]?.en || 'Order Status Updated',
      titleHi: statusTitles[status]?.hi || 'ऑर्डर स्थिति अपडेट हुई',
      message: `Your order #${order.orderId} status is now "${status}".`,
      messageHi: `आपके ऑर्डर #${order.orderId} की स्थिति अब "${status}" है।`,
      deepLink: `/farmer/orders/${order._id}`,
      metadata: { orderId: order._id, status }
    });

    emitNotification(notif);
    emitOrderUpdate(order);

    // Push to Farmer in Hindi
    const pushStatusHi: Record<OrderStatus, string> = {
      PENDING: 'प्रतीक्षारत (Pending)',
      CONFIRMED: 'स्वीकृत (Confirmed) - गाड़ी तैयार है',
      DELIVERED: 'सफलतापूर्वक डिलीवर हो गया',
      CANCELLED: 'रद्द कर दिया गया'
    };

    sendPushToUser(String(order.farmerId), {
      title: `📦 ऑर्डर स्थिति: ${statusTitles[status]?.hi || status}`,
      body: `आपके ऑर्डर #${order.orderId} की स्थिति अब "${pushStatusHi[status] || status}" है।`,
      url: `/farmer/orders/${order._id}`,
      tag: `order-status-${order._id}`
    }).catch((err) => console.error('Push error:', err));

    await AuditLog.create({
      actorId: user?.userId || 'ADMIN',
      actorName: user?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'ORDER_STATUS_CHANGED',
      entityType: 'Order',
      entityId: order._id.toString(),
      details: { orderId: order.orderId, oldStatus: previousStatus, newStatus: status }
    });

    res.json({ success: true, message: `Order marked as ${status}`, data: order });
  } catch (error: any) {
    logger.error("Order", "Request error", error);
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};
