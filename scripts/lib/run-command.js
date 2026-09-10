const { spawnSync } = require("node:child_process");

class CommandError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "CommandError";
    this.status = details.status ?? 1;
    this.stdout = details.stdout || "";
    this.stderr = details.stderr || "";
  }
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    env: options.env || process.env,
    cwd: options.cwd,
  });

  if (result.error) {
    throw new CommandError(result.error.message, { status: 1 });
  }

  if (result.status !== 0 && !options.allowFailure) {
    const detail = `${result.stdout || ""}${result.stderr || ""}`.trim();
    throw new CommandError(detail || `${command} exited ${result.status}`, {
      status: result.status || 1,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  }

  return result;
}

module.exports = { CommandError, runCommand };
