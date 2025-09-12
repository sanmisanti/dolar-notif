#!/usr/bin/env node

import { MonitorService } from './monitor.js';
import { Scheduler } from './scheduler.js';
import { Dashboard } from './dashboard.js';
import readline from 'readline';

class DolarNotifApp {
  constructor() {
    this.monitor = new MonitorService();
    this.scheduler = new Scheduler(this.monitor);
    this.dashboard = new Dashboard(this.monitor);
    this.rl = null;
    this.isRunning = false;
  }

  async start() {
    try {
      console.log('🇦🇷 DÓLAR NOTIF - Monitor de Cotización Oficial');
      console.log('================================================\n');

      await this.monitor.initialize();
      
      this.scheduler.start();
      this.isRunning = true;

      await this.dashboard.showStatus();
      
      this.setupInteractiveMode();
      
    } catch (error) {
      console.error('💥 Error crítico al iniciar:', error);
      process.exit(1);
    }
  }

  setupInteractiveMode() {
    // Si está corriendo bajo PM2, no usar modo interactivo
    if (process.env.PM2_MODE) {
      console.log('\n🚀 Modo daemon activado (PM2). Sistema funcionando en background.');
      console.log('💡 Usa "pm2 logs dolar-notif" para ver actividad');
      console.log('💡 Usa "npm run status" para ver estado');
      return;
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\n💰 dolar> '
    });

    console.log('\n✨ Modo interactivo activado. Escribe "help" para ver comandos disponibles.');
    this.rl.prompt();

    this.rl.on('line', async (input) => {
      const command = input.trim().toLowerCase();
      await this.handleCommand(command);
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      this.shutdown();
    });
  }

  async handleCommand(command) {
    try {
      switch (command) {
        case 'status':
          await this.dashboard.showStatus();
          break;
          
        case 'history':
          await this.dashboard.showHistorical();
          break;
          
        case 'analysis':
          await this.dashboard.showAnalysis();
          break;
          
        case 'today':
          await this.dashboard.showTodaySummary();
          break;
          
        case 'monitor':
          console.log('🔄 Ejecutando monitoreo manual...');
          const result = await this.monitor.checkAndAnalyze();
          if (result.success) {
            console.log(`✅ Precio: $${result.data.currentPrice} | Alertas: ${result.data.alerts?.length || 0}`);
          } else {
            console.log(`❌ Error: ${result.error}`);
          }
          break;
          
        case 'test':
          console.log('📧 Probando notificaciones...');
          const testResult = await this.monitor.testNotifications();
          console.log(testResult ? '✅ Test exitoso' : '❌ Test falló');
          break;
          
        case 'schedule':
          const scheduleStatus = this.scheduler.getStatus();
          console.log('\n⏰ ESTADO DEL SCHEDULER:');
          console.log(`Estado: ${scheduleStatus.isRunning ? '✅ Activo' : '❌ Inactivo'}`);
          console.log(`Próxima ejecución: ${scheduleStatus.nextExecution}`);
          console.log(`Debe ejecutar ahora: ${scheduleStatus.shouldRunNow ? 'Sí' : 'No'}`);
          console.log(`Hora actual: ${scheduleStatus.currentTime}`);
          break;
          
        case 'urgent':
          console.log('🚨 Programando verificación urgente...');
          await this.scheduler.scheduleUrgentCheck(2);
          break;
          
        case 'report':
          console.log('📧 Enviando reporte bidiario...');
          await this.scheduler.sendReportNow();
          break;
          
        case 'help':
          this.dashboard.showHelp();
          console.log('\n⚡ COMANDOS ADICIONALES:');
          console.log('schedule   - Estado del programador');
          console.log('urgent     - Verificación urgente (2 min)');
          console.log('report     - Enviar reporte bidiario ahora');
          break;
          
        case 'exit':
        case 'quit':
          this.shutdown();
          break;
          
        case '':
          break;
          
        default:
          console.log(`❓ Comando desconocido: "${command}". Escribe "help" para ver comandos.`);
      }
    } catch (error) {
      console.error('❌ Error ejecutando comando:', error.message);
    }
  }

  async shutdown() {
    console.log('\n🛑 Cerrando aplicación...');
    
    if (this.scheduler.isRunning) {
      this.scheduler.stop();
    }
    
    await this.monitor.cleanup();
    
    if (this.rl) {
      this.rl.close();
    }
    
    console.log('👋 ¡Hasta luego!');
    process.exit(0);
  }

  setupSignalHandlers() {
    const gracefulShutdown = (signal) => {
      console.log(`\n🔔 Señal ${signal} recibida`);
      this.shutdown();
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGUSR2', gracefulShutdown); // nodemon
    
    process.on('uncaughtException', (error) => {
      console.error('💥 Excepción no capturada:', error);
      this.shutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Promesa rechazada no manejada:', reason);
      this.shutdown();
    });
  }
}

async function main() {
  const app = new DolarNotifApp();
  app.setupSignalHandlers();
  await app.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}