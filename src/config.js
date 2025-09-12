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
    path: process.env.DB_PATH || './data/dollar_history.db'
  },
  schedule: {
    cron: '*/30 11-18 * * 1-5',
    timezone: 'America/Argentina/Buenos_Aires',
    reportCron: '0 19 */2 * *'  // Cada 2 días a las 19:00
  }
};