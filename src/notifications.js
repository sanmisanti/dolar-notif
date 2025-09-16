import nodemailer from 'nodemailer';
import { config } from './config.js';

export class NotificationService {
  constructor() {
    this.transporter = null;
    this.lastNotificationTime = new Map();
    this.cooldownPeriod = process.env.TESTING_MODE === 'true' ? 5 * 1000 : 30 * 60 * 1000; // 5 seg en testing, 30 min en producción
    this.lastReportDate = null;
  }

  async initialize() {
    if (!config.email.user || !config.email.pass || !config.email.to) {
      console.warn('Configuración de email incompleta. Las notificaciones estarán deshabilitadas.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });

    try {
      await this.transporter.verify();
      console.log('Servicio de notificaciones inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando notificaciones:', error.message);
      this.transporter = null;
    }
  }

  canSendNotification(alertType) {
    const lastSent = this.lastNotificationTime.get(alertType);
    const now = Date.now();
    
    if (!lastSent || (now - lastSent) >= this.cooldownPeriod) {
      this.lastNotificationTime.set(alertType, now);
      return true;
    }
    
    return false;
  }

  async sendAnalysisResult(analysisResult) {
    if (!this.transporter || !analysisResult.alerts || analysisResult.alerts.length === 0) {
      return;
    }

    const importantAlerts = analysisResult.alerts.filter(
      alert => alert.severity === 'high' || alert.severity === 'critical'
    );

    if (importantAlerts.length === 0) {
      return;
    }

    const primaryAlert = importantAlerts[0];
    
    if (!this.canSendNotification(primaryAlert.type)) {
      console.log(`Notificación de ${primaryAlert.type} en cooldown`);
      return;
    }

    const subject = this.generateSubject(primaryAlert, analysisResult);
    const html = this.generateHtml(analysisResult);

    try {
      await this.transporter.sendMail({
        from: config.email.user,
        to: config.email.to,
        subject,
        html
      });

      console.log(`✅ Notificación enviada: ${primaryAlert.type}`);
    } catch (error) {
      console.error('Error enviando notificación:', error.message);
    }
  }

  generateSubject(primaryAlert, analysisResult) {
    const price = analysisResult.currentPrice;
    const emoji = this.getAlertEmoji(primaryAlert.severity);

    switch (primaryAlert.type) {
      case 'statistical_opportunity':
        return `${emoji} Alerta por Z-Score - Dólar $${price} (${primaryAlert.details.zScore} desv.)`;
      case 'deadline_approaching':
      case 'deadline_passed':
        return `${emoji} Alerta por Proximidad de DL - Dólar $${price} (${primaryAlert.details?.daysRemaining || 0} días)`;
      case 'trend_opportunity':
        return `${emoji} Alerta por TD - Dólar $${price} (${primaryAlert.details.consecutiveDeclines} caídas)`;
      case 'approaching_deadline':
        return `${emoji} Alerta por Proximidad de DL - Dólar $${price} (${primaryAlert.details?.daysRemaining || 0} días)`;
      default:
        return `${emoji} Alerta Dólar Oficial $${price}`;
    }
  }

  generateHtml(analysisResult) {
    const { currentPrice, statistics, alerts, recommendation, confidence } = analysisResult;
    
    const alertsHtml = alerts
      .filter(alert => alert.severity === 'high' || alert.severity === 'critical')
      .map(alert => this.generateAlertHtml(alert))
      .join('');

    const recommendationColor = this.getRecommendationColor(recommendation);
    const recommendationText = this.getRecommendationText(recommendation);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .price { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
            .stats { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .alert { margin: 15px 0; padding: 15px; border-radius: 8px; border-left: 4px solid; }
            .alert.high { background: #fff3cd; border-color: #ffc107; }
            .alert.critical { background: #f8d7da; border-color: #dc3545; }
            .recommendation { padding: 20px; text-align: center; border-radius: 8px; font-weight: bold; font-size: 1.2em; margin: 20px 0; }
            .footer { margin-top: 30px; padding: 15px; background: #e9ecef; border-radius: 8px; font-size: 0.9em; color: #6c757d; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🇦🇷 Alerta Dólar Oficial</h1>
            <div class="price">$${currentPrice}</div>
            <div>${new Date().toLocaleString('es-AR')}</div>
        </div>

        <div class="stats">
            <h3>📊 Estadísticas (últimas ${statistics.count} muestras)</h3>
            <p><strong>Media:</strong> $${statistics.mean.toFixed(2)} | <strong>Mediana:</strong> $${statistics.median.toFixed(2)}</p>
            <p><strong>Rango:</strong> $${statistics.min.toFixed(2)} - $${statistics.max.toFixed(2)} | <strong>Desv. Est:</strong> ${statistics.stdDev.toFixed(2)}</p>
            <p><strong>Q1:</strong> $${statistics.q1.toFixed(2)} | <strong>Q3:</strong> $${statistics.q3.toFixed(2)}</p>
        </div>

        ${alertsHtml}

        <div class="recommendation" style="background-color: ${recommendationColor}; color: white;">
            🎯 Recomendación: ${recommendationText}
            <br><small>Confianza: ${(confidence * 100).toFixed(0)}%</small>
        </div>

        <div class="footer">
            <p><strong>💡 Recordatorio:</strong> Debes comprar USD $100 antes del 6 de octubre de 2025</p>
            <p>Esta es una notificación automática del sistema de monitoreo del dólar oficial argentino.</p>
            <p><small>Fuente: dolarapi.com | Generado: ${new Date().toISOString()}</small></p>
        </div>
    </body>
    </html>
    `;
  }

  generateAlertHtml(alert) {
    const emoji = this.getAlertEmoji(alert.severity);
    const detailsHtml = alert.details ? 
      Object.entries(alert.details)
        .map(([key, value]) => `<li><strong>${this.translateKey(key)}:</strong> ${value}</li>`)
        .join('') : '';

    return `
    <div class="alert ${alert.severity}">
        <h3>${emoji} ${alert.message}</h3>
        ${detailsHtml ? `<ul>${detailsHtml}</ul>` : ''}
        <p><em>Confianza: ${(alert.confidence * 100).toFixed(0)}%</em></p>
    </div>
    `;
  }

  getAlertEmoji(severity) {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      default: return 'ℹ️';
    }
  }

  getRecommendationColor(recommendation) {
    switch (recommendation) {
      case 'buy_immediate': return '#dc3545';
      case 'buy_soon': return '#fd7e14';
      case 'monitor_closely': return '#ffc107';
      case 'monitor': return '#17a2b8';
      default: return '#6c757d';
    }
  }

  getRecommendationText(recommendation) {
    switch (recommendation) {
      case 'buy_immediate': return '🔴 COMPRAR INMEDIATAMENTE';
      case 'buy_soon': return '🟠 COMPRAR PRONTO';
      case 'monitor_closely': return '🟡 MONITOREAR DE CERCA';
      case 'monitor': return '🔵 SEGUIR MONITOREANDO';
      default: return '⚫ ESPERAR';
    }
  }

  translateKey(key) {
    const translations = {
      currentPrice: 'Precio Actual',
      mean: 'Media',
      deviation: 'Desviación',
      zScore: 'Z-Score',
      consecutiveDeclines: 'Caídas Consecutivas',
      totalDecline: 'Caída Total',
      daysRemaining: 'Días Restantes',
      percentile25: 'Percentil 25',
      currentVsMean: 'Diferencia vs Media',
      volatilityRatio: 'Ratio Volatilidad'
    };
    return translations[key] || key;
  }

  async sendBidailyReport(database) {
    if (!this.transporter) {
      console.log('❌ Servicio de notificaciones no disponible para reporte');
      return false;
    }

    try {
      const reportData = await this.generateReportData(database);
      const subject = `📊 Reporte Dólar - ${new Date().toLocaleDateString('es-AR')}`;
      const html = this.generateReportHtml(reportData);

      await this.transporter.sendMail({
        from: config.email.user,
        to: config.email.to,
        subject,
        html
      });

      this.lastReportDate = new Date().toDateString();
      console.log('✅ Reporte bidaíly enviado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error enviando reporte:', error.message);
      return false;
    }
  }

  async generateReportData(database) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Datos de hoy
    const todayData = await database.getTodayData();
    
    // Datos de ayer
    const yesterdayData = await this.getDateData(database, yesterday);
    
    // Estadísticas históricas
    const weeklyStats = await database.getStatistics(7);
    const monthlyStats = await database.getStatistics(30);
    
    // Precio más bajo histórico
    const allTimeData = await database.getRecentRates(1000);
    const historicalMin = allTimeData.length > 0 
      ? Math.min(...allTimeData.map(d => d.compra))
      : null;
    
    const currentPrice = todayData.length > 0 ? todayData[todayData.length - 1].compra : null;
    const lowestPercentage = historicalMin && currentPrice 
      ? ((currentPrice - historicalMin) / historicalMin * 100)
      : null;

    // Días restantes
    const targetDate = new Date('2025-10-06');
    const daysRemaining = Math.max(0, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)));

    return {
      date: today,
      today: {
        data: todayData,
        opening: todayData.length > 0 ? todayData[0].compra : null,
        closing: todayData.length > 0 ? todayData[todayData.length - 1].compra : null,
        min: todayData.length > 0 ? Math.min(...todayData.map(d => d.compra)) : null,
        max: todayData.length > 0 ? Math.max(...todayData.map(d => d.compra)) : null,
        count: todayData.length
      },
      yesterday: {
        data: yesterdayData,
        opening: yesterdayData.length > 0 ? yesterdayData[0].compra : null,
        closing: yesterdayData.length > 0 ? yesterdayData[yesterdayData.length - 1].compra : null,
        min: yesterdayData.length > 0 ? Math.min(...yesterdayData.map(d => d.compra)) : null,
        max: yesterdayData.length > 0 ? Math.max(...yesterdayData.map(d => d.compra)) : null,
        count: yesterdayData.length
      },
      statistics: {
        weekly: weeklyStats,
        monthly: monthlyStats
      },
      historical: {
        min: historicalMin,
        lowestPercentage: lowestPercentage
      },
      daysRemaining
    };
  }

  async getDateData(database, date) {
    return new Promise((resolve, reject) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const query = `
        SELECT * FROM dollar_history 
        WHERE timestamp >= ? AND timestamp <= ?
        ORDER BY timestamp ASC
      `;
      
      database.db.all(query, [startOfDay.toISOString(), endOfDay.toISOString()], (error, rows) => {
        if (error) {
          reject(error);
        } else {
          const data = rows.map(row => ({
            ...row,
            fecha_actualizacion: new Date(row.fecha_actualizacion),
            timestamp: new Date(row.timestamp),
            created_at: new Date(row.created_at)
          }));
          resolve(data);
        }
      });
    });
  }

  generateReportHtml(data) {
    const { today, yesterday, statistics, historical, daysRemaining } = data;
    
    const todayChange = today.opening && today.closing 
      ? ((today.closing - today.opening) / today.opening * 100).toFixed(2)
      : null;
    
    const yesterdayChange = yesterday.opening && yesterday.closing
      ? ((yesterday.closing - yesterday.opening) / yesterday.opening * 100).toFixed(2)
      : null;
    
    const dayOverDayChange = yesterday.closing && today.closing
      ? ((today.closing - yesterday.closing) / yesterday.closing * 100).toFixed(2)
      : null;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
            .title { font-size: 1.8em; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 1.1em; opacity: 0.9; }
            .section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745; }
            .day-section { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 10px 0; }
            .price { font-size: 1.4em; font-weight: bold; color: #28a745; }
            .change-positive { color: #dc3545; font-weight: bold; }
            .change-negative { color: #28a745; font-weight: bold; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
            .stat-item { background: white; padding: 15px; border-radius: 6px; text-align: center; }
            .highlight { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { margin-top: 30px; padding: 15px; background: #e9ecef; border-radius: 8px; font-size: 0.9em; color: #6c757d; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f1f3f4; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">📊 Reporte Dólar Oficial</div>
            <div class="subtitle">${data.date.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div class="section">
            <h3>📈 Resumen de Precios</h3>
            
            <div class="day-section">
                <h4>🗓️ HOY (${data.date.toLocaleDateString('es-AR')})</h4>
                ${today.count > 0 ? `
                <table>
                    <tr><th>Apertura</th><td class="price">$${today.opening?.toFixed(2) || 'N/A'}</td></tr>
                    <tr><th>Cierre</th><td class="price">$${today.closing?.toFixed(2) || 'N/A'}</td></tr>
                    <tr><th>Mínimo</th><td>$${today.min?.toFixed(2) || 'N/A'}</td></tr>
                    <tr><th>Máximo</th><td>$${today.max?.toFixed(2) || 'N/A'}</td></tr>
                    <tr><th>Variación</th><td class="${todayChange >= 0 ? 'change-positive' : 'change-negative'}">${todayChange ? (todayChange >= 0 ? '+' : '') + todayChange + '%' : 'N/A'}</td></tr>
                    <tr><th>Consultas</th><td>${today.count}</td></tr>
                </table>
                ` : '<p>❌ Sin datos disponibles para hoy</p>'}
            </div>

            <div class="day-section">
                <h4>📅 AYER (${new Date(data.date.getTime() - 24*60*60*1000).toLocaleDateString('es-AR')})</h4>
                ${yesterday.count > 0 ? `
                <table>
                    <tr><th>Apertura</th><td class="price">$${yesterday.opening?.toFixed(2) || 'N/A'}</td></tr>
                    <tr><th>Cierre</th><td class="price">$${yesterday.closing?.toFixed(2) || 'N/A'}</td></tr>
                    <tr><th>Mínimo</th><td>$${yesterday.min?.toFixed(2) || 'N/A'}</td></tr>
                    <tr><th>Máximo</th><td>$${yesterday.max?.toFixed(2) || 'N/A'}</td></tr>
                    <tr><th>Variación</th><td class="${yesterdayChange >= 0 ? 'change-positive' : 'change-negative'}">${yesterdayChange ? (yesterdayChange >= 0 ? '+' : '') + yesterdayChange + '%' : 'N/A'}</td></tr>
                    <tr><th>Consultas</th><td>${yesterday.count}</td></tr>
                </table>
                ` : '<p>❌ Sin datos disponibles para ayer</p>'}
            </div>

            ${dayOverDayChange ? `
            <div class="highlight">
                <strong>📊 Variación Día sobre Día:</strong> 
                <span class="${dayOverDayChange >= 0 ? 'change-positive' : 'change-negative'}">
                    ${dayOverDayChange >= 0 ? '+' : ''}${dayOverDayChange}%
                </span>
            </div>
            ` : ''}
        </div>

        <div class="section">
            <h3>📊 Estadísticas Históricas</h3>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <h4>📅 Última Semana</h4>
                    <p><strong>Media:</strong> $${statistics.weekly?.avg_compra?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Rango:</strong> $${statistics.weekly?.min_compra?.toFixed(2) || 'N/A'} - $${statistics.weekly?.max_compra?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Muestras:</strong> ${statistics.weekly?.count || 0}</p>
                </div>
                
                <div class="stat-item">
                    <h4>📆 Último Mes</h4>
                    <p><strong>Media:</strong> $${statistics.monthly?.avg_compra?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Rango:</strong> $${statistics.monthly?.min_compra?.toFixed(2) || 'N/A'} - $${statistics.monthly?.max_compra?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Muestras:</strong> ${statistics.monthly?.count || 0}</p>
                </div>
            </div>

            ${historical.min ? `
            <div class="highlight">
                <h4>🏆 Récord Histórico</h4>
                <p><strong>Precio más bajo registrado:</strong> <span class="price">$${historical.min.toFixed(2)}</span></p>
                ${today.closing ? `
                <p><strong>Diferencia vs hoy:</strong> 
                    <span class="${historical.lowestPercentage >= 0 ? 'change-positive' : 'change-negative'}">
                        ${historical.lowestPercentage >= 0 ? '+' : ''}${historical.lowestPercentage?.toFixed(2)}%
                    </span>
                </p>
                ` : ''}
            </div>
            ` : ''}
        </div>

        <div class="section">
            <h3>🎯 Estado del Objetivo</h3>
            <div class="highlight">
                <p><strong>🎯 Objetivo:</strong> Comprar USD $100</p>
                <p><strong>📅 Fecha límite:</strong> 6 de octubre de 2025</p>
                <p><strong>⏰ Días restantes:</strong> <span style="font-size: 1.2em; font-weight: bold; color: ${daysRemaining <= 7 ? '#dc3545' : daysRemaining <= 14 ? '#fd7e14' : '#28a745'}">${daysRemaining} días</span></p>
                ${daysRemaining <= 14 ? '<p style="color: #dc3545; font-weight: bold;">⚠️ ¡Fecha límite aproximándose!</p>' : ''}
            </div>
        </div>

        <div class="footer">
            <p><strong>📧 Tipo de email:</strong> Reporte bidaíly de seguimiento (cada 2 días)</p>
            <p><strong>🚨 Recordatorio:</strong> Las alertas de oportunidad de compra se envían por separado cuando se detectan condiciones favorables</p>
            <p><small>Fuente: dolarapi.com | Generado automáticamente: ${new Date().toISOString()}</small></p>
        </div>
    </body>
    </html>
    `;
  }

  shouldSendBidailyReport() {
    const today = new Date().toDateString();
    
    // Si nunca se envió un reporte
    if (!this.lastReportDate) {
      return true;
    }
    
    // Si han pasado 2 días o más
    const lastReport = new Date(this.lastReportDate);
    const now = new Date();
    const daysDiff = Math.floor((now - lastReport) / (1000 * 60 * 60 * 24));
    
    return daysDiff >= 2;
  }

  async testNotification() {
    if (!this.transporter) {
      console.log('❌ Servicio de notificaciones no disponible');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: config.email.user,
        to: config.email.to,
        subject: '🧪 Test - Sistema Dólar Notificaciones',
        html: `
        <h2>✅ Test de Notificaciones</h2>
        <p>El sistema de notificaciones está funcionando correctamente.</p>
        <p><small>Enviado: ${new Date().toLocaleString('es-AR')}</small></p>
        `
      });

      console.log('✅ Email de prueba enviado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error enviando email de prueba:', error.message);
      return false;
    }
  }
}