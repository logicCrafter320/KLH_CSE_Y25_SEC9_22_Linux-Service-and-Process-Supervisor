const { executeCommand } = require('../utils/commandExecutor');
const si = require('systeminformation');

// Get all processes (supports server-side search)
exports.getAllProcesses = async (req, res, next) => {
  try {
    const { sortBy = 'cpu', limit = 100, q = '' } = req.query;

    let sortFlag;
    switch (sortBy) {
      case 'memory': sortFlag = '--sort=-%mem'; break;
      case 'pid': sortFlag = '--sort=-pid'; break;
      case 'name': sortFlag = '--sort=comm'; break;
      default: sortFlag = '--sort=-%cpu';
    }

    let command;
    if (q) {
      const sanitized = q.replace(/[^a-zA-Z0-9._@-]/g, '');
      command = `ps aux ${sortFlag} --no-headers | grep -i "${sanitized}" | grep -v "grep" | head -${limit}`;
    } else {
      command = `ps aux ${sortFlag} --no-headers | head -${limit}`;
    }

    const { stdout } = await executeCommand(command);

    const processes = stdout.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        user: parts[0],
        pid: parseInt(parts[1]),
        cpu: parseFloat(parts[2]),
        mem: parseFloat(parts[3]),
        vsz: parseInt(parts[4]),
        rss: parseInt(parts[5]),
        tty: parts[6],
        stat: parts[7],
        start: parts[8],
        time: parts[9],
        command: parts.slice(10).join(' ')
      };
    }).filter(p => !isNaN(p.pid));

    res.json({
      success: true,
      count: processes.length,
      data: processes
    });
  } catch (error) {
    next(error);
  }
};

// Get process details by PID
exports.getProcessDetail = async (req, res, next) => {
  try {
    const { pid } = req.params;
    const sanitizedPid = parseInt(pid, 10);

    if (isNaN(sanitizedPid)) {
      return res.status(400).json({ success: false, error: 'Invalid PID' });
    }

    const [psResult, statusResult] = await Promise.all([
      executeCommand(`ps -p ${sanitizedPid} -o pid,ppid,user,%cpu,%mem,vsz,rss,tty,stat,start,time,comm,args --no-headers`),
      executeCommand(`cat /proc/${sanitizedPid}/status 2>/dev/null`)
    ]);

    if (!psResult.success || !psResult.stdout) {
      return res.status(404).json({ success: false, error: 'Process not found' });
    }

    const parts = psResult.stdout.trim().split(/\s+/);

    const statusMap = {};
    if (statusResult.stdout) {
      statusResult.stdout.split('\n').forEach(line => {
        const [key, ...vals] = line.split(':');
        if (key) statusMap[key.trim()] = (vals.join(':') || '').trim();
      });
    }

    res.json({
      success: true,
      data: {
        pid: parseInt(parts[0]),
        ppid: parseInt(parts[1]),
        user: parts[2],
        cpu: parseFloat(parts[3]),
        mem: parseFloat(parts[4]),
        vsz: parseInt(parts[5]),
        rss: parseInt(parts[6]),
        tty: parts[7],
        stat: parts[8],
        start: parts[9],
        time: parts[10],
        command: parts[11],
        fullCommand: parts.slice(12).join(' ') || parts[11],
        threads: statusMap['Threads'] || 'N/A',
        voluntaryCtxSwitches: statusMap['voluntary_ctxt_switches'] || 'N/A',
        nonVoluntaryCtxSwitches: statusMap['nonvoluntary_ctxt_switches'] || 'N/A',
        vmPeak: statusMap['VmPeak'] || 'N/A',
        vmSize: statusMap['VmSize'] || 'N/A',
        vmRSS: statusMap['VmRSS'] || 'N/A',
        state: statusMap['State'] || 'N/A'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Kill a process using native Node.js / Linux kill(2) system call
exports.killProcess = async (req, res, next) => {
  try {
    const { pid } = req.params;
    const { signal = 'SIGTERM' } = req.body;
    const sanitizedPid = parseInt(pid, 10);

    if (isNaN(sanitizedPid)) {
      return res.status(400).json({ success: false, error: 'Invalid PID' });
    }

    if (sanitizedPid <= 1) {
      return res.status(403).json({
        success: false,
        error: 'Cannot kill system-critical process (PID <= 1)'
      });
    }

    try {
      // Direct Native System Call to Linux Kernel!
      process.kill(sanitizedPid, signal);
      
      res.json({
        success: true,
        message: `Signal ${signal} sent to process ${sanitizedPid}`
      });
    } catch (err) {
      let msg = err.message;
      if (err.code === 'ESRCH') msg = `Process ${sanitizedPid} does not exist`;
      if (err.code === 'EPERM') msg = `Permission denied to kill PID ${sanitizedPid}`;

      res.json({
        success: false,
        message: msg
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.getProcessTree = async (req, res, next) => {
  try {
    const { stdout } = await executeCommand('pstree -p -a --no-color | head -100');
    res.json({ success: true, data: stdout });
  } catch (error) {
    next(error);
  }
};

exports.getProcessSummary = async (req, res, next) => {
  try {
    const processes = await si.processes();
    res.json({
      success: true,
      data: {
        all: processes.all,
        running: processes.running,
        blocked: processes.blocked,
        sleeping: processes.sleeping,
        unknown: processes.unknown
      }
    });
  } catch (error) {
    next(error);
  }
};
