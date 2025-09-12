#!/usr/bin/env node

import { MonitorService } from './src/monitor.js';

async function testReport() {
  console.log('📧 PROBANDO SISTEMA DE REPORTES BIDIARIOS');
  console.log('==========================================\n');

  const monitor = new MonitorService();

  try {
    console.log('1️⃣ Inicializando sistema...');
    await monitor.initialize();
    console.log('✅ Sistema inicializado\n');

    console.log('2️⃣ Generando datos de prueba...');
    for (let i = 0; i < 5; i++) {
      await monitor.checkAndAnalyze();
      console.log(`   Consulta ${i + 1}/5 completada`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('✅ Datos de prueba generados\n');

    console.log('3️⃣ Forzando envío de reporte...');
    // Forzar que el reporte se pueda enviar
    monitor.notifications.lastReportDate = null;
    
    const success = await monitor.notifications.sendBidailyReport(monitor.db);
    
    if (success) {
      console.log('✅ Reporte enviado exitosamente');
      console.log('📧 Revisa tu email para ver el reporte completo');
    } else {
      console.log('❌ Error enviando reporte');
    }

    await monitor.cleanup();

    console.log('\n🎉 PRUEBA COMPLETADA!');
    console.log('====================');
    console.log(`${success ? '✅' : '❌'} Reporte bidiario: ${success ? 'Funcionando' : 'Error'}`);

  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
    await monitor.cleanup();
  }
}

testReport().catch(console.error);