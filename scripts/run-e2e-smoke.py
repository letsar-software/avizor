"""Ejecuta los smoketests de Playwright contra una única instancia de Avizor.

Los smoketests existentes conservan puertos históricos. Para no arrancar una
instancia de Next por cada puerto, este runner los deriva localmente al servidor
que escucha en 3000.
"""

from __future__ import annotations

import os
import re
import select
import signal
import socket
import socketserver
import subprocess
import sys
import threading
import time
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = ROOT / "scripts"
TARGET_HOST = "127.0.0.1"
TARGET_PORT = 3000
PORT_PATTERN = re.compile(r"(?:localhost|127\.0\.0\.1):(\d+)")


class ReuseThreadingTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


class PortRelay(socketserver.BaseRequestHandler):
    def handle(self) -> None:
        with socket.create_connection((TARGET_HOST, TARGET_PORT)) as upstream:
            sockets = [self.request, upstream]
            while True:
                readable, _, _ = select.select(sockets, [], [])
                for source in readable:
                    payload = source.recv(65536)
                    if not payload:
                        return
                    destination = upstream if source is self.request else self.request
                    destination.sendall(payload)


def smoke_scripts() -> list[Path]:
    return sorted(path for path in SCRIPTS_DIR.glob("*.py") if path.name != Path(__file__).name)


def smoke_ports(scripts: list[Path]) -> list[int]:
    ports = {TARGET_PORT}
    for script in scripts:
        ports.update(int(port) for port in PORT_PATTERN.findall(script.read_text()))
    return sorted(ports)


def wait_for_app(process: subprocess.Popen[str]) -> None:
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"next_start_failed ({process.returncode})")
        try:
            with urllib.request.urlopen(f"http://{TARGET_HOST}:{TARGET_PORT}", timeout=2) as response:
                if response.status < 500:
                    return
        except OSError:
            time.sleep(1)
    raise RuntimeError("next_start_timeout")


def start_relays(ports: list[int]) -> list[ReuseThreadingTCPServer]:
    relays: list[ReuseThreadingTCPServer] = []
    for port in ports:
        if port == TARGET_PORT:
            continue
        relay = ReuseThreadingTCPServer((TARGET_HOST, port), PortRelay)
        threading.Thread(target=relay.serve_forever, daemon=True).start()
        relays.append(relay)
    return relays


def main() -> None:
    scripts = smoke_scripts()
    if not scripts:
        raise RuntimeError("no_smoke_scripts_found")

    subprocess.run(["npm", "run", "db:migrate"], cwd=ROOT, check=True)
    environment = os.environ | {"PORT": str(TARGET_PORT), "NEXT_TELEMETRY_DISABLED": "1"}
    app = subprocess.Popen(["npm", "start"], cwd=ROOT, env=environment, text=True)
    relays: list[ReuseThreadingTCPServer] = []
    try:
        wait_for_app(app)
        relays = start_relays(smoke_ports(scripts))
        for script in scripts:
            print(f"running {script.relative_to(ROOT)}", flush=True)
            subprocess.run([sys.executable, str(script)], cwd=ROOT, check=True)
    finally:
        for relay in relays:
            relay.shutdown()
            relay.server_close()
        if app.poll() is None:
            app.send_signal(signal.SIGTERM)
            try:
                app.wait(timeout=15)
            except subprocess.TimeoutExpired:
                app.kill()
                app.wait()


if __name__ == "__main__":
    main()
