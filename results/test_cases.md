# Verified Test Cases
1. Native C Supervisor engine compilation & process supervisor startup.
2. Real-time /proc telemetry parsing via Node.js backend & React WebSocket stream.
3. Background process creation (`sleep 9999 &`) & live UI detection.
4. Process termination via UI Kill button (`process.kill()` / `SIGTERM`).
5. Audit event logging in `supervisor.log`.
