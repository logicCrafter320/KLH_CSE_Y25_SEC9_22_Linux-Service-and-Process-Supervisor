# 🐧 Linux Service & Process Supervisor

A modern, real-time web-based interface for monitoring and managing Linux services, 
processes, and system resources. Built with React.js, Node.js, Express.js, and Tailwind CSS.

![Dashboard Preview](https://img.shields.io/badge/Platform-Linux-blue)
![Node](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 📊 Dashboard
- Real-time CPU, Memory, Disk, and Network monitoring
- WebSocket-powered live updates
- System information overview
- Quick action shortcuts

### ⚙️ Service Manager
- List all systemd services
- Start, Stop, Restart, Reload services
- Enable/Disable services at boot
- Search and filter services
- Grid and Table view modes
- Service detail information

### 📋 Process Monitor
- Real-time process listing with CPU/Memory usage
- Sort by CPU, Memory, PID, or Name
- Kill processes with configurable signals (SIGTERM, SIGKILL, etc.)
- Process detail view with thread info, memory maps
- Process summary statistics
- Search by command, user, or PID

### 📝 Log Viewer
- Browse systemd journal logs
- Filter by unit, priority, time range
- Kernel (dmesg) log support
- **Live log streaming** via WebSocket
- Export logs to file
- Priority-based color coding

### 🔧 Settings
- WebSocket connection status
- Configurable refresh intervals
- System information display
- Logged-in users list

## 🛠 Tech Stack

| Component  | Technology |
|------------|-----------|
| Frontend   | React.js 18, Tailwind CSS 3 |
| Backend    | Node.js, Express.js |
| Real-time  | WebSocket (express-ws) |
| System Info| systeminformation, child_process |
| Icons      | Heroicons |
| HTTP Client| Axios |
| Notifications | react-hot-toast |

## 🚀 Quick Start

### Prerequisites
- Linux operating system (Ubuntu, Debian, CentOS, Fedora, Arch, etc.)
- Node.js 18+ and npm
- systemd (for service management)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/linux-supervisor.git
cd linux-supervisor

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install