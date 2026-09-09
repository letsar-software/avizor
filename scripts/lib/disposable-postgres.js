const net = require("node:net");
const { runCommand } = require("./run-command");

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function createDisposablePostgres(config) {
  const container = config.container;
  const databaseUrl = `postgres://${config.user}:${config.password}@127.0.0.1:${config.hostPort}/${config.database}`;
  const dockerRun = [
    "docker",
    "run",
    "--name",
    container,
    "-e",
    `POSTGRES_USER=${config.user}`,
    "-e",
    `POSTGRES_PASSWORD=${config.password}`,
    "-e",
    `POSTGRES_DB=${config.database}`,
    "-p",
    `${config.hostPort}:5432`,
    "-d",
    config.image,
  ];

  function query(sql) {
    const result = runCommand(
      "docker",
      [
        "exec",
        container,
        "psql",
        "-U",
        config.user,
        "-d",
        config.database,
        "-v",
        "ON_ERROR_STOP=1",
        "-tAc",
        sql,
      ],
      { capture: true },
    );
    return (result.stdout || "").trim();
  }

  function isReadyInsideContainer() {
    const ready = runCommand(
      "docker",
      ["exec", container, "pg_isready", "-U", config.user, "-d", config.database],
      { allowFailure: true, capture: true },
    );
    return ready.status === 0;
  }

  async function waitUntilReady() {
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (isReadyInsideContainer() && (await isHostPortOpen(config.hostPort))) return;
      sleep(1000);
    }
    throw new Error("PostgreSQL descartable no aceptó conexiones a tiempo.");
  }

  async function start() {
    runCommand("docker", ["rm", "-f", container], { allowFailure: true });
    runCommand(dockerRun[0], dockerRun.slice(1));
    await waitUntilReady();
  }

  return {
    command: dockerRun.join(" "),
    container,
    databaseUrl,
    start,
    query,
  };
}

function isHostPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port: Number(port) });
    const finish = (open) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

module.exports = { createDisposablePostgres };
