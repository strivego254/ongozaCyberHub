const path = require('path');
const os = require('os');

// Get home directory (works for both root and regular users)
const homeDir = os.homedir();
const projectDir = path.join(homeDir, 'ongozacyberhub');
const appDir = path.join(projectDir, 'frontend', 'nextjs_app');

module.exports = {
  apps: [{
    name: 'ongoza-nextjs',
    script: 'npm',
    args: 'start',
    cwd: appDir,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: path.join(homeDir, '.pm2', 'logs', 'ongoza-nextjs-error.log'),
    out_file: path.join(homeDir, '.pm2', 'logs', 'ongoza-nextjs-out.log'),
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};

