import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

dotenv.config();

import { connectDB } from './config/db';
import { initializeSocketIO } from './services/socketService';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { isOriginAllowed, validateEnvironment } from './config/env';

validateEnvironment();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => callback(isOriginAllowed(origin) ? null : new Error('Origin not allowed'), isOriginAllowed(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});
initializeSocketIO(io);

// Security & Parsing Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true
  })
);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-7', legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Static Uploads Directory
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api', apiRoutes);

// Health Check Endpoint
app.get('/health', (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503);
  res.json({
    status: databaseReady ? 'ok' : 'degraded',
    service: 'Banshidhar Poultry API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5050;

// Connect DB & Start Server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🐔 BANSHIDHAR POULTRY SERVER STARTED`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`📡 Realtime Socket.IO: Active`);
    console.log(`📁 Uploads dir: ${uploadsPath}\n`);
  });
});

const shutdown = async (signal: string): Promise<void> => {
  console.log(`[Server] ${signal} received, shutting down gracefully.`);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

export { app, server };
