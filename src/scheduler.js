import cron from 'node-cron';
import { config } from './config.js';

export class Scheduler {
  constructor(monitorService) {
    this.monitorService = monitorService;
    this.tasks = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler ya está ejecutándose');
      return;
    }

    const mainTask = cron.schedule(config.schedule.cron, async () => {
      await this.executeMonitoring();
    }, {
      scheduled: false,
      timezone: config.schedule.timezone
    });

    const reportTask = cron.schedule(config.schedule.reportCron, async () => {
      await this.executeBidailyReport();
    }, {
      scheduled: false,
      timezone: config.schedule.timezone
    });

    const startupTask = cron.schedule('* * * * *', async () => {
      if (this.shouldRunNow()) {
        console.log('🚀 Ejecutando monitoreo inicial...');
        await this.executeMonitoring();
      }
      startupTask.stop();
    }, {
      scheduled: false,
      timezone: config.schedule.timezone
    });

    this.tasks.set('main', mainTask);
    this.tasks.set('report', reportTask);
    this.tasks.set('startup', startupTask);

    mainTask.start();
    reportTask.start();
    startupTask.start();
    
    this.isRunning = true;
    
    console.log('📅 Scheduler iniciado');
    console.log(`⏰ Monitoreo: Lunes a Viernes, 11:00-18:00, cada 30 minutos`);
    console.log(`📧 Reportes: Cada 2 días a las 19:00`);
    console.log(`🌍 Zona horaria: ${config.schedule.timezone}`);
    console.log(`📍 Próxima ejecución: ${this.getNextExecution()}`);
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler no está ejecutándose');
      return;
    }

    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`🛑 Tarea ${name} detenida`);
    });

    this.tasks.clear();
    this.isRunning = false;
    console.log('📅 Scheduler detenido');
  }

  shouldRunNow() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    const isWeekday = day >= 1 && day <= 5;
    const isBankingHours = hour >= 11 && hour <= 18;
    
    return isWeekday && isBankingHours;
  }

  getNextExecution() {
    const now = new Date();
    const next = new Date(now);
    
    if (!this.shouldRunNow()) {
      if (now.getDay() === 0) {
        next.setDate(next.getDate() + 1);
      } else if (now.getDay() === 6) {
        next.setDate(next.getDate() + 2);
      } else if (now.getHours() < 11) {
        next.setHours(11, 0, 0, 0);
      } else if (now.getHours() >= 18) {
        next.setDate(next.getDate() + 1);
        if (next.getDay() === 6) {
          next.setDate(next.getDate() + 2);
        }
        next.setHours(11, 0, 0, 0);
      }
    } else {
      const minutes = next.getMinutes();
      const nextInterval = Math.ceil(minutes / 30) * 30;
      if (nextInterval === 60) {
        next.setHours(next.getHours() + 1, 0, 0, 0);
      } else {
        next.setMinutes(nextInterval, 0, 0);
      }
    }
    
    return next.toLocaleString('es-AR');
  }

  async executeMonitoring() {
    try {
      console.log(`\n🔄 Iniciando monitoreo - ${new Date().toLocaleString('es-AR')}`);
      
      if (!this.shouldRunNow()) {
        console.log('⏰ Fuera de horario bancario, saltando ejecución');
        return;
      }

      const result = await this.monitorService.checkAndAnalyze();
      
      if (result.success) {
        console.log(`✅ Monitoreo completado - Precio: $${result.data.currentPrice}`);
        
        if (result.data.alerts && result.data.alerts.length > 0) {
          console.log(`🚨 ${result.data.alerts.length} alerta(s) detectada(s)`);
          result.data.alerts.forEach(alert => {
            console.log(`   ${alert.severity.toUpperCase()}: ${alert.message}`);
          });
        } else {
          console.log('✌️ Sin alertas');
        }
        
        console.log(`🎯 Recomendación: ${result.data.recommendation}`);
        console.log(`📊 Confianza: ${(result.data.confidence * 100).toFixed(0)}%`);
      } else {
        console.error(`❌ Error en monitoreo: ${result.error}`);
      }
      
    } catch (error) {
      console.error('💥 Error crítico en scheduler:', error);
    }
  }

  async runOnce() {
    console.log('🔧 Ejecutando monitoreo manual...');
    await this.executeMonitoring();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      tasksCount: this.tasks.size,
      shouldRunNow: this.shouldRunNow(),
      nextExecution: this.getNextExecution(),
      currentTime: new Date().toLocaleString('es-AR'),
      timezone: config.schedule.timezone,
      schedule: config.schedule.cron
    };
  }

  scheduleOneTime(date, callback) {
    const cronExpression = this.dateToCron(date);
    
    const oneTimeTask = cron.schedule(cronExpression, async () => {
      try {
        await callback();
        oneTimeTask.stop();
        console.log(`✅ Tarea programada ejecutada: ${date.toLocaleString('es-AR')}`);
      } catch (error) {
        console.error(`❌ Error en tarea programada: ${error.message}`);
        oneTimeTask.stop();
      }
    }, {
      scheduled: true,
      timezone: config.schedule.timezone
    });

    console.log(`📅 Tarea programada para: ${date.toLocaleString('es-AR')}`);
    return oneTimeTask;
  }

  dateToCron(date) {
    return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
  }

  async executeBidailyReport() {
    try {
      console.log(`\n📧 Generando reporte bidiario - ${new Date().toLocaleString('es-AR')}`);
      
      if (!this.monitorService.notifications.shouldSendBidailyReport()) {
        console.log('⏰ Reporte ya enviado recientemente, saltando');
        return;
      }

      const success = await this.monitorService.notifications.sendBidailyReport(this.monitorService.db);
      
      if (success) {
        console.log('✅ Reporte bidiario enviado exitosamente');
      } else {
        console.log('❌ Error enviando reporte bidiario');
      }
      
    } catch (error) {
      console.error('💥 Error crítico generando reporte:', error);
    }
  }

  async scheduleUrgentCheck(minutesFromNow = 5) {
    const urgentDate = new Date();
    urgentDate.setMinutes(urgentDate.getMinutes() + minutesFromNow);
    
    console.log(`🚨 Programando verificación urgente en ${minutesFromNow} minutos`);
    
    return this.scheduleOneTime(urgentDate, async () => {
      console.log('🚨 EJECUTANDO VERIFICACIÓN URGENTE');
      await this.executeMonitoring();
    });
  }

  async sendReportNow() {
    console.log('📧 Generando reporte manual...');
    await this.executeBidailyReport();
  }
}