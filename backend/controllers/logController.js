const { executeCommand, streamCommand } = require('../utils/commandExecutor');

// Get journal logs
exports.getJournalLogs = async (req, res, next) => {
  try {
    const { unit, lines = 100, priority, since, until } = req.query;

    let cmd = `journalctl --no-pager -o json`;

    if (unit) {
      const sanitizedUnit = unit.replace(/[^a-zA-Z0-9._@-]/g, '');
      cmd += ` -u ${sanitizedUnit}`;
    }

    if (priority) {
      const sanitizedPriority = parseInt(priority);
      if (!isNaN(sanitizedPriority) && sanitizedPriority >= 0 && sanitizedPriority <= 7) {
        cmd += ` -p ${sanitizedPriority}`;
      }
    }

    if (since) {
      cmd += ` --since "${since}"`;
    }

    if (until) {
      cmd += ` --until "${until}"`;
    }

    cmd += ` -n ${Math.min(parseInt(lines) || 100, 500)}`;

    const result = await executeCommand(cmd, 30000);

    let logs = [];
    if (result.stdout) {
      logs = result.stdout.split('\n').filter(line => line.trim()).map(line => {
        try {
          const parsed = JSON.parse(line);
          return {
            timestamp: parsed.__REALTIME_TIMESTAMP
              ? new Date(parseInt(parsed.__REALTIME_TIMESTAMP) / 1000).toISOString()
              : 'N/A',
            unit: parsed._SYSTEMD_UNIT || parsed.SYSLOG_IDENTIFIER || 'N/A',
            priority: parsed.PRIORITY || 'N/A',
            message: parsed.MESSAGE || '',
            pid: parsed._PID || 'N/A',
            hostname: parsed._HOSTNAME || 'N/A'
          };
        } catch {
          return { timestamp: 'N/A', message: line, unit: 'N/A', priority: 'N/A' };
        }
      });
    }

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// Get available log units
exports.getLogUnits = async (req, res, next) => {
  try {
    const result = await executeCommand(
      'journalctl --field=_SYSTEMD_UNIT --no-pager 2>/dev/null | sort | head -100'
    );

    const units = result.stdout
      ? result.stdout.split('\n').filter(line => line.trim())
      : [];

    res.json({
      success: true,
      data: units
    });
  } catch (error) {
    next(error);
  }
};

// Get dmesg (kernel) logs
exports.getDmesgLogs = async (req, res, next) => {
  try {
    const { lines = 50 } = req.query;
    const result = await executeCommand(
      `dmesg --time-format iso -T 2>/dev/null | tail -${Math.min(parseInt(lines) || 50, 200)}`
    );

    const logs = result.stdout
      ? result.stdout.split('\n').filter(l => l.trim()).map(line => ({
          raw: line,
          timestamp: line.match(/^\[(.*?)\]/) ? line.match(/^\[(.*?)\]/)[1].trim() : '',
          message: line.replace(/^\[.*?\]\s*/, '')
        }))
      : [];

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// Stream logs via WebSocket (defined in routes)
exports.streamLogs = (ws, req) => {
  const { unit } = req.query;
  let cmd = 'journalctl -f --no-pager -o short-precise';

  if (unit) {
    const sanitized = unit.replace(/[^a-zA-Z0-9._@-]/g, '');
    cmd += ` -u ${sanitized}`;
  }

  const child = streamCommand(cmd);

  child.stdout.on('data', (data) => {
    try {
      ws.send(JSON.stringify({
        type: 'log',
        data: data.toString().trim()
      }));
    } catch (e) {
      // WebSocket may be closed
    }
  });

  child.stderr.on('data', (data) => {
    try {
      ws.send(JSON.stringify({
        type: 'error',
        data: data.toString().trim()
      }));
    } catch (e) {}
  });

  ws.on('close', () => {
    child.kill();
  });

  ws.on('error', () => {
    child.kill();
  });
};