import dotenv from 'dotenv';

dotenv.config();

export const config = {
  api: {
    url: 'https://dolarapi.com/v1/dolares/oficial',
    timeout: 10000
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    to: process.env.EMAIL_TO
  },
  alerts: {
    deviationThreshold: parseFloat(process.env.ALERT_DEVIATION_THRESHOLD) || 2.0,
    minSamples: parseInt(process.env.ALERT_MIN_SAMPLES) || 10,
    trendConsecutive: parseInt(process.env.ALERT_TREND_CONSECUTIVE) || 3
  },
  database: {
    path: process.env.DB_PATH || (process.env.TESTING_MODE === 'true' ? './data/testing_history.db' : './data/dollar_history.db')
  },
  schedule: {
    cron: process.env.SCHEDULE_CRON || '*/30 11-18 * * 1-5',
    timezone: process.env.SCHEDULE_TIMEZONE || 'America/Argentina/Buenos_Aires',
    reportCron: process.env.SCHEDULE_REPORT_CRON || '0 19 */2 * *',
    // Configuración dinámica para validaciones
    startHour: parseInt(process.env.SCHEDULE_START_HOUR) || 11,
    endHour: parseInt(process.env.SCHEDULE_END_HOUR) || 18,
    weekdaysOnly: process.env.SCHEDULE_WEEKDAYS_ONLY !== 'false', // default true
    intervalMinutes: parseInt(process.env.SCHEDULE_INTERVAL_MINUTES) || 30
  }
};