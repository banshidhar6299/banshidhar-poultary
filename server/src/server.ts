import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import { connectDB } from './config/db';
import { initializeSocketIO } from './services/socketService';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
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
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// Static Uploads Directory
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api', apiRoutes);

// Health Check Endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Banshidhar Poultry API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
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

export { app, server };
