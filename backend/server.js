const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');
const auth = require('./middleware/auth'); // <--- Imported auth middleware

dotenv.config();

const app = express();

// Initialize express-ws
const expressWs = require('express-ws');
expressWs(app);

// Global Middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// Protect all /api endpoints with API key authentication
app.use('/api', auth); // <--- Protected API routes

// Routes
app.use('/api/services', require('./routes/services'));
app.use('/api/processes', require('./routes/processes'));
app.use('/api/system', require('./routes/system'));
app.use('/api/logs', require('./routes/logs'));

// WebSocket endpoint for real-time stats
app.ws('/ws/stats', (ws, req) => {
  const si = require('systeminformation');

  const interval = setInterval(async () => {
    try {
      const [cpu, mem, fsSize, networkStats, currentLoad] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
        si.currentLoad()
      ]);

      ws.send(JSON.stringify({
        type: 'system_stats',
        data: {
          cpu: {
            model: cpu.manufacturer + ' ' + cpu.brand,
            speed: cpu.speed,
            cores: cpu.cores,
            load: currentLoad.currentLoad.toFixed(2)
          },
          memory: {
            total: mem.total,
            used: mem.used,
            free: mem.free,
            usedPercent: ((mem.used / mem.total) * 100).toFixed(2)
          },
          disk: fsSize.map(fs => ({
            fs: fs.fs,
            size: fs.size,
            used: fs.used,
            available: fs.available,
            usedPercent: fs.use
          })),
          network: networkStats.map(net => ({
            iface: net.iface,
            rx_bytes: net.rx_bytes,
            tx_bytes: net.tx_bytes,
            rx_sec: net.rx_sec,
            tx_sec: net.tx_sec
          })),
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('WebSocket stats error:', error.message);
    }
  }, 2000);

  ws.on('close', () => clearInterval(interval));
  ws.on('error', () => clearInterval(interval));
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Linux Supervisor Backend running on port ${5000}`);
  console.log(`📊 WebSocket available at ws://localhost:${5000}/ws/stats`);
});