module.exports = {
  apps: [
    {
      name: 'dolar-notif-production',
      script: 'src/index.js',
      cwd: '/home/ubuntu/dolargit/dolar-notif',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        TESTING_MODE: 'false',

        // Horario bancario argentino (UTC equivalente)
        SCHEDULE_CRON: '*/10 14-21 * * 1-5',
        SCHEDULE_START_HOUR: '14',
        SCHEDULE_END_HOUR: '21',
        SCHEDULE_WEEKDAYS_ONLY: 'true',
        SCHEDULE_INTERVAL_MINUTES: '10',
        SCHEDULE_TIMEZONE: 'America/Argentina/Buenos_Aires',
        SCHEDULE_REPORT_CRON: '0 22 */2 * *',

        // Emails de producción
        EMAIL_TO: 'sanmisanti@gmail.com,ignavillanueva96@gmail.com',

        // Base de datos de producción
        DB_PATH: './data/dollar_history.db'
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'dolar-notif-testing',
      script: 'src/index.js',
      cwd: '/home/ubuntu/dolargit/dolar-notif',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'testing',
        TESTING_MODE: 'true',

        // Testing cada 5 minutos, 24/7
        SCHEDULE_CRON: '*/5 * * * *',
        SCHEDULE_START_HOUR: '0',
        SCHEDULE_END_HOUR: '23',
        SCHEDULE_WEEKDAYS_ONLY: 'false',
        SCHEDULE_INTERVAL_MINUTES: '5',
        SCHEDULE_TIMEZONE: 'America/Argentina/Buenos_Aires',
        SCHEDULE_REPORT_CRON: '*/5 * * * *',

        // Solo email de testing
        EMAIL_TO: 'sanmisanti@gmail.com',

        // Base de datos de testing
        DB_PATH: './data/testing_history.db'
      },
      error_file: './logs/pm2-testing-error.log',
      out_file: './logs/pm2-testing-out.log',
      log_file: './logs/pm2-testing-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};