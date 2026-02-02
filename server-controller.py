import subprocess
import os
from pathlib import Path
import threading
import sys

# === CONFIG ===
SERVER_DIR = Path(r"C:\Users\roger\OneDrive\Desktop\Github Desktop\3STARSWIRL-web\portal")
SERVER_FILE = "server.js"

server_process = None

# === HELPERS ===
def find_server():
    if (SERVER_DIR / SERVER_FILE).exists():
        return SERVER_DIR
    for root, dirs, files in os.walk(SERVER_DIR.parent):
        if SERVER_FILE in files:
            return Path(root)
    return None

def stream_logs(proc):
    try:
        for line in proc.stdout:
            print(f"[SERVER] {line}", end="")
    except Exception as e:
        print(f"⚠️ Error reading logs: {e}")

# === SERVER CONTROL ===
def start_server():
    global server_process
    if server_process and server_process.poll() is None:
        print("Server already running!")
        return

    folder = find_server()
    if not folder:
        print("❌ Cannot find server.js!")
        return

    server_process = subprocess.Popen(
        ["node", SERVER_FILE],
        cwd=folder,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=True,
        bufsize=1,
        universal_newlines=True
    )
    print(f"✅ Server started in {folder}")
    threading.Thread(target=stream_logs, args=(server_process,), daemon=True).start()

def stop_server():
    global server_process
    if server_process and server_process.poll() is None:
        try:
            if os.name == "nt":
                os.system(f"taskkill /F /PID {server_process.pid} >nul 2>&1")
            else:
                import signal
                server_process.send_signal(signal.SIGINT)
            server_process = None
            print("🛑 Server stopped")
        except Exception as e:
            print(f"⚠️ Error stopping server: {e}")
    else:
        print("Server is not running!")

def server_status():
    if server_process and server_process.poll() is None:
        print("Server is running ✅")
    else:
        print("Server is not running ❌")

# === CLI ===
print("=== Dev Server Controller (Clean) ===")
print("Commands: start | stop | status | exit")

while True:
    try:
        cmd = input("> ").strip().lower()
    except (KeyboardInterrupt, EOFError):
        print("\nExiting...")
        stop_server()
        sys.exit(0)

    if cmd == "start":
        start_server()
    elif cmd == "stop":
        stop_server()
    elif cmd == "status":
        server_status()
    elif cmd == "exit":
        stop_server()
        break
    else:
        print("Unknown command")
