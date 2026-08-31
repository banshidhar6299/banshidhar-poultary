import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';

// Admin: Get Audit Logs with search & pagination
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, entityType, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (action && action !== 'ALL') filter.action = action;
    if (entityType && entityType !== 'ALL') filter.entityType = entityType;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};
