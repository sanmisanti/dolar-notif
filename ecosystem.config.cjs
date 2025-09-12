module.exports = {
  apps: [{
    name: 'dolar-notif',
    script: 'src/index.js',
    cwd: '/mnt/c/Users/sanmi/Documents/Proyectos/dolarnotif',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production',
      PM2_MODE: 'true'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};