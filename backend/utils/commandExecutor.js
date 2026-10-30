const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const executeCommand = async (command, timeout = 10000) => {
  try {
    const { stdout, stderr } = await execAsync(command, { timeout });
    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim()
    };
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout ? error.stdout.trim() : '',
      stderr: error.stderr ? error.stderr.trim() : error.message,
      code: error.code
    };
  }
};

const streamCommand = (command, args = []) => {
  return spawn(command, args, {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });
};

module.exports = { executeCommand, streamCommand };