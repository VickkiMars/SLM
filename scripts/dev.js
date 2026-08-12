const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', ' Starting SLM Full-Stack Dev Environment (Backend + Frontend)...');

// 1. Start Express Backend API Server on Port 8000
const backend = spawn('node', ['server.js'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || '8000' }
});

// 2. Start Vite Frontend Dev Server on Port 5173 with API Proxy
const frontend = spawn('npx', ['vite', 'frontend'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: process.env,
  shell: true
});

function cleanup() {
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
