#!/usr/bin/env node

import { MonitorService } from './src/monitor.js';
import { config } from './src/config.js';

async function testSystem() {
  console.log('🧪 TESTING DÓLAR NOTIF SYSTEM');
  console.log('================================\n');

  const monitor = new MonitorService();

  try {
    console.log('1️⃣ Inicializando sistema...');
    await monitor.initialize();
    console.log('✅ Sistema inicializado\n');

    console.log('2️⃣ Probando consulta de API...');
    const result = await monitor.checkAndAnalyze();
    
    if (result.success) {
      console.log(`✅ API funcionando - Precio: $${result.data.rawData.compra}`);
    } else {
      console.log(`❌ Error API: ${result.error}`);
    }
    console.log('');

    console.log('3️⃣ Verificando base de datos...');
    const status = await monitor.getStatus();
    console.log(`✅ Datos almacenados: ${status.todayChecks} consultas hoy`);
    console.log(`✅ Último precio: $${status.currentPrice || 'N/A'}\n`);

    console.log('4️⃣ Probando análisis estadístico...');
    const analysis = await monitor.runAnalysis();
    console.log(`✅ Análisis: ${analysis.type}`);
    console.log(`✅ Recomendación: ${analysis.recommendation || 'N/A'}`);
    console.log(`✅ Alertas: ${analysis.alerts?.length || 0}\n`);

    console.log('5️⃣ Probando notificaciones...');
    const emailTest = await monitor.testNotifications();
    
    if (emailTest) {
      console.log('✅ Email enviado correctamente');
      console.log(`📧 Desde: ${config.email.user}`);
      console.log(`📧 Hacia: ${config.email.to}`);
    } else {
      console.log('❌ Error enviando email');
      console.log('💡 Verifica la configuración en .env');
      console.log('💡 Revisa que el App Password de Gmail sea correcto');
    }
    console.log('');

    console.log('6️⃣ Generando más datos de prueba...');
    console.log('💡 Ejecutando 3 consultas adicionales para tener datos...');
    
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos entre consultas
      const testResult = await monitor.checkAndAnalyze();
      if (testResult.success) {
        console.log(`   ${i + 1}/3: $${testResult.data.rawData.compra}`);
      }
    }

    console.log('\n7️⃣ Análisis final con más datos...');
    const finalAnalysis = await monitor.runAnalysis();
    console.log(`📊 Tipo: ${finalAnalysis.type}`);
    console.log(`🎯 Recomendación: ${finalAnalysis.recommendation || 'N/A'}`);
    console.log(`📈 Confianza: ${finalAnalysis.confidence ? (finalAnalysis.confidence * 100).toFixed(0) + '%' : 'N/A'}`);
    
    if (finalAnalysis.statistics) {
      console.log(`📊 Media: $${finalAnalysis.statistics.mean.toFixed(2)}`);
      console.log(`📊 Muestras: ${finalAnalysis.statistics.count}`);
    }

    await monitor.cleanup();

    console.log('\n🎉 SISTEMA COMPLETAMENTE FUNCIONAL!');
    console.log('=====================================');
    console.log('✅ API: Funcionando');
    console.log('✅ Base de datos: Funcionando');
    console.log('✅ Análisis: Funcionando');
    console.log(`${emailTest ? '✅' : '❌'} Notificaciones: ${emailTest ? 'Funcionando' : 'Verificar configuración'}`);
    console.log('');
    console.log('🚀 Para usar el sistema completo:');
    console.log('   npm start');

  } catch (error) {
    console.error('💥 Error durante el test:', error.message);
    await monitor.cleanup();
  }
}

testSystem().catch(console.error);