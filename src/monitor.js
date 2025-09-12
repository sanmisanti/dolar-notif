import { DolarAPI } from './api.js';
import { Database } from './database.js';
import { Analytics } from './analytics.js';
import { NotificationService } from './notifications.js';

export class MonitorService {
  constructor() {
    this.api = new DolarAPI();
    this.db = new Database();
    this.analytics = new Analytics(this.db);
    this.notifications = new NotificationService();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🔧 Inicializando servicios...');
      
      await this.db.initialize();
      console.log('✅ Base de datos inicializada');
      
      await this.notifications.initialize();
      console.log('✅ Sistema de notificaciones inicializado');
      
      const apiTest = await this.api.testConnection();
      if (apiTest) {
        console.log('✅ Conexión con API verificada');
      } else {
        console.warn('⚠️ Problemas con la conexión de API');
      }
      
      this.isInitialized = true;
      console.log('🚀 MonitorService inicializado correctamente\n');
      
    } catch (error) {
      console.error('❌ Error inicializando MonitorService:', error);
      throw error;
    }
  }

  async checkAndAnalyze() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const rateData = await this.api.fetchOfficialRate();
      console.log(`📈 Precio obtenido: Compra $${rateData.compra} - Venta $${rateData.venta}`);

      await this.db.saveRate(rateData);
      console.log('💾 Datos guardados en base de datos');

      const analysisResult = await this.analytics.analyzeCurrentPrice(rateData.compra);
      console.log(`🧠 Análisis completado: ${analysisResult.alerts?.length || 0} alerta(s)`);

      if (analysisResult.alerts && analysisResult.alerts.length > 0) {
        await this.notifications.sendAnalysisResult(analysisResult);
      }

      return {
        success: true,
        data: {
          ...analysisResult,
          rawData: rateData,
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Error en monitoreo:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async getStatus() {
    try {
      const recent = await this.db.getRecentRates(1);
      const todayData = await this.db.getTodayData();
      const stats = await this.db.getStatistics(7);
      
      return {
        isInitialized: this.isInitialized,
        lastUpdate: recent[0] ? recent[0].timestamp : null,
        todayChecks: todayData.length,
        weeklyStats: stats,
        currentPrice: recent[0] ? recent[0].compra : null
      };
    } catch (error) {
      return {
        isInitialized: this.isInitialized,
        error: error.message
      };
    }
  }

  async getHistoricalData(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const rates = await this.db.getRecentRates(days * 15); // Aproximadamente
      
      return rates.filter(rate => rate.timestamp >= startDate);
    } catch (error) {
      console.error('Error obteniendo datos históricos:', error);
      return [];
    }
  }

  async runAnalysis(price = null) {
    try {
      if (!price) {
        const recent = await this.db.getRecentRates(1);
        if (recent.length === 0) {
          throw new Error('No hay datos disponibles para análisis');
        }
        price = recent[0].compra;
      }

      return await this.analytics.analyzeCurrentPrice(price);
    } catch (error) {
      console.error('Error ejecutando análisis:', error);
      return {
        type: 'error',
        message: error.message,
        recommendation: 'wait',
        confidence: 0
      };
    }
  }

  async testNotifications() {
    return await this.notifications.testNotification();
  }

  async cleanup() {
    console.log('🧹 Limpiando recursos...');
    await this.db.close();
    console.log('✅ Recursos liberados');
  }
}