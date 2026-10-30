# System Architecture
- Native C Supervisor Engine: Multithreaded process lifecycle, signals, IPC (FIFO/shm), and /proc telemetry.
- Node.js Express Gateway: Port 5000 REST API and WebSocket streaming.
- React Web Console: Port 3000 responsive dashboard for process monitoring and execution control.
