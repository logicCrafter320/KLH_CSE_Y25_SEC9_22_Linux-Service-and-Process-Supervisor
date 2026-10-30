const si = require('systeminformation');
const { executeCommand } = require('../utils/commandExecutor');

// Get full system info
exports.getSystemInfo = async (req, res, next) => {
  try {
    const [system, os, cpu, mem, fsSize, time, users] = await Promise.all([
      si.system(),
      si.osInfo(),
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.time(),
      si.users()
    ]);

    res.json({
      success: true,
      data: {
        system: {
          manufacturer: system.manufacturer,
          model: system.model,
          serial: system.serial
        },
        os: {
          platform: os.platform,
          distro: os.distro,
          release: os.release,
          kernel: os.kernel,
          arch: os.arch,
          hostname: os.hostname
        },
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          speed: cpu.speed,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores
        },
        memory: {
          total: mem.total,
          used: mem.used,
          free: mem.free,
          available: mem.available,
          swapTotal: mem.swaptotal,
          swapUsed: mem.swapused,
          swapFree: mem.swapfree
        },
        disk: fsSize.map(fs => ({
          fs: fs.fs,
          type: fs.type,
          size: fs.size,
          used: fs.used,
          available: fs.available,
          use: fs.use,
          mount: fs.mount
        })),
        uptime: time.uptime,
        timezone: time.timezone,
        users: users.map(u => ({
          user: u.user,
          terminal: u.tty,
          loginDate: u.date,
          loginTime: u.time,
          ip: u.ip
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current CPU load
exports.getCpuLoad = async (req, res, next) => {
  try {
    const load = await si.currentLoad();

    res.json({
      success: true,
      data: {
        avgLoad: load.avgLoad,
        currentLoad: load.currentLoad,
        currentLoadUser: load.currentLoadUser,
        currentLoadSystem: load.currentLoadSystem,
        currentLoadIdle: load.currentLoadIdle,
        cpus: load.cpus.map((cpu, idx) => ({
          core: idx,
          load: cpu.load,
          loadUser: cpu.loadUser,
          loadSystem: cpu.loadSystem,
          loadIdle: cpu.loadIdle
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get memory details
exports.getMemoryInfo = async (req, res, next) => {
  try {
    const mem = await si.mem();

    res.json({
      success: true,
      data: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        active: mem.active,
        available: mem.available,
        buffcache: mem.buffcache,
        swaptotal: mem.swaptotal,
        swapused: mem.swapused,
        swapfree: mem.swapfree,
        usedPercent: ((mem.used / mem.total) * 100).toFixed(2),
        swapUsedPercent: mem.swaptotal > 0
          ? ((mem.swapused / mem.swaptotal) * 100).toFixed(2)
          : '0.00'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get network info
exports.getNetworkInfo = async (req, res, next) => {
  try {
    const [interfaces, stats, connections] = await Promise.all([
      si.networkInterfaces(),
      si.networkStats(),
      si.networkConnections()
    ]);

    res.json({
      success: true,
      data: {
        interfaces: interfaces.map(iface => ({
          iface: iface.iface,
          ip4: iface.ip4,
          ip6: iface.ip6,
          mac: iface.mac,
          type: iface.type,
          speed: iface.speed,
          operstate: iface.operstate
        })),
        stats: stats.map(stat => ({
          iface: stat.iface,
          rx_bytes: stat.rx_bytes,
          tx_bytes: stat.tx_bytes,
          rx_sec: stat.rx_sec,
          tx_sec: stat.tx_sec
        })),
        connectionsCount: connections.length,
        connectionsByState: connections.reduce((acc, conn) => {
          acc[conn.state] = (acc[conn.state] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};