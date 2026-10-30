const { executeCommand } = require('../utils/commandExecutor');

// Get all systemd services
exports.getAllServices = async (req, res, next) => {
  try {
    const { stdout } = await executeCommand(
      "systemctl list-units --type=service --all --no-pager --plain --no-legend"
    );

    const services = stdout.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        unit: parts[0] || '',
        load: parts[1] || '',
        active: parts[2] || '',
        sub: parts[3] || '',
        description: parts.slice(4).join(' ') || ''
      };
    });

    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    next(error);
  }
};

// Get service details
exports.getServiceDetail = async (req, res, next) => {
  try {
    const { serviceName } = req.params;
    const sanitized = serviceName.replace(/[^a-zA-Z0-9._@-]/g, '');

    const [statusResult, showResult] = await Promise.all([
      executeCommand(`systemctl status ${sanitized} --no-pager 2>/dev/null`),
      executeCommand(`systemctl show ${sanitized} --no-pager 2>/dev/null`)
    ]);

    // Parse systemctl show output into key-value pairs
    const properties = {};
    if (showResult.stdout) {
      showResult.stdout.split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx > -1) {
          properties[line.substring(0, idx)] = line.substring(idx + 1);
        }
      });
    }

    res.json({
      success: true,
      data: {
        name: sanitized,
        status: statusResult.stdout,
        properties: {
          type: properties.Type || 'N/A',
          activeState: properties.ActiveState || 'N/A',
          subState: properties.SubState || 'N/A',
          loadState: properties.LoadState || 'N/A',
          unitFileState: properties.UnitFileState || 'N/A',
          mainPID: properties.MainPID || '0',
          execMainStartTimestamp: properties.ExecMainStartTimestamp || 'N/A',
          memoryUsage: properties.MemoryCurrent || 'N/A',
          cpuUsage: properties.CPUUsageNSec || 'N/A',
          restartCount: properties.NRestarts || '0',
          description: properties.Description || 'N/A',
          fragmentPath: properties.FragmentPath || 'N/A',
          user: properties.User || 'N/A',
          group: properties.Group || 'N/A',
          environment: properties.Environment || 'N/A'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Control service (start, stop, restart, enable, disable)
exports.controlService = async (req, res, next) => {
  try {
    const { serviceName } = req.params;
    const { action } = req.body;
    const sanitized = serviceName.replace(/[^a-zA-Z0-9._@-]/g, '');

    const allowedActions = ['start', 'stop', 'restart', 'reload', 'enable', 'disable'];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: `Invalid action. Allowed: ${allowedActions.join(', ')}`
      });
    }

    const result = await executeCommand(`sudo systemctl ${action} ${sanitized}`);

    res.json({
      success: result.success,
      message: result.success
        ? `Service ${sanitized} ${action}ed successfully`
        : `Failed to ${action} service ${sanitized}`,
      output: result.stderr || result.stdout
    });
  } catch (error) {
    next(error);
  }
};

// Search services
exports.searchServices = async (req, res, next) => {
  try {
    const { q } = req.query;
    const sanitized = q ? q.replace(/[^a-zA-Z0-9._@*-]/g, '') : '';

    const { stdout } = await executeCommand(
      `systemctl list-units --type=service --all --no-pager --plain --no-legend | grep -i "${sanitized}"`
    );

    const services = stdout.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        unit: parts[0] || '',
        load: parts[1] || '',
        active: parts[2] || '',
        sub: parts[3] || '',
        description: parts.slice(4).join(' ') || ''
      };
    });

    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    next(error);
  }
};