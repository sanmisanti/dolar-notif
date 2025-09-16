#!/usr/bin/env node

/**
 * SCRIPT DE TESTING COMPLETO - TODAS LAS CARACTERÍSTICAS
 *
 * Este script simula diferentes escenarios para probar:
 * 1. Alerta Z-score (precio 2+ σ por debajo de la media)
 * 2. Alerta de 3 caídas consecutivas
 * 3. Alerta de proximidad de deadline (≤7 días)
 * 4. Reporte bi-diario
 */

import { MonitorService } from './src/monitor.js';
import { Analytics } from './src/analytics.js';
import { Database } from './src/database.js';
import { NotificationService } from './src/notifications.js';

// Configurar solo email de testing
process.env.EMAIL_TO = 'sanmisanti@gmail.com';
process.env.TESTING_MODE = 'true';
process.env.DB_PATH = './data/simulation_test.db';

class FeatureTester {
  constructor() {
    this.db = new Database();
    this.analytics = new Analytics(this.db);
    this.notifications = new NotificationService();
    this.monitor = new MonitorService();
  }

  async initialize() {
    console.log('🧪 INICIANDO TESTING COMPLETO DE CARACTERÍSTICAS');
    console.log('==============================================\n');

    await this.db.initialize();
    await this.notifications.initialize();
    console.log('✅ Servicios inicializados\n');
  }

  async cleanup() {
    await this.db.close();
    console.log('🧹 Limpieza completada\n');
  }

  // Simular datos históricos para testing
  async seedTestData() {
    console.log('📊 CREANDO DATOS DE PRUEBA...');

    const basePrice = 1400;
    const baseDate = new Date('2025-09-10');

    // Crear 20 días de datos históricos con tendencia normal
    for (let i = 0; i < 20; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);

      // Precio normal con variación pequeña
      const price = basePrice + (Math.random() - 0.5) * 20;

      const testData = {
        compra: price,
        venta: price + 50,
        casa: 'nacion',
        nombre: 'Oficial',
        moneda: 'USD',
        fechaActualizacion: date  // Pasar objeto Date directamente
      };

      // Insertar con timestamp específico
      await new Promise((resolve, reject) => {
        this.db.db.run(
          `INSERT INTO dollar_history (compra, venta, casa, nombre, moneda, fecha_actualizacion, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [testData.compra, testData.venta, testData.casa, testData.nombre, testData.moneda, testData.fechaActualizacion, date.toISOString()],
          (err) => err ? reject(err) : resolve()
        );
      });
    }

    console.log('✅ Datos base creados (20 días, precio ~$1400)\n');
  }

  // Test 1: Z-score alert
  async testZScoreAlert() {
    console.log('🧮 TEST 1: ALERTA Z-SCORE (Precio 2+ σ por debajo)');
    console.log('================================================');

    // Agregar precio muy bajo para disparar alerta z-score
    const lowPrice = 1300; // Significativamente por debajo de 1400
    console.log(`💰 Simulando precio bajo: $${lowPrice} (vs media ~$1400)`);

    const result = await this.analytics.analyzeCurrentPrice(lowPrice);

    console.log('📈 Resultado del análisis:');
    console.log(`   Alertas detectadas: ${result.alerts?.length || 0}`);

    if (result.alerts && result.alerts.length > 0) {
      result.alerts.forEach(alert => {
        console.log(`   🚨 ${alert.type}: ${alert.message}`);
        console.log(`      Severidad: ${alert.severity}`);
      });

      console.log('\n📧 Enviando email de alerta...');
      await this.notifications.sendAnalysisResult(result);
      console.log('✅ Email enviado con alerta Z-score\n');
    } else {
      console.log('❌ No se detectó alerta Z-score (revisar umbral)\n');
    }
  }

  // Test 2: 3 consecutive drops
  async testConsecutiveDropsAlert() {
    console.log('📉 TEST 2: ALERTA 3 CAÍDAS CONSECUTIVAS');
    console.log('======================================');

    console.log('💰 Simulando 3 caídas consecutivas...');

    const basePriceForDrops = 1450;
    const drops = [
      { price: basePriceForDrops, desc: 'Precio inicial' },
      { price: basePriceForDrops - 15, desc: 'Primera caída (-$15)' },
      { price: basePriceForDrops - 35, desc: 'Segunda caída (-$20)' },
      { price: basePriceForDrops - 60, desc: 'Tercera caída (-$25)' }
    ];

    // Insertar las caídas consecutivas (más recientes que datos base)
    for (let i = 0; i < drops.length; i++) {
      const date = new Date();
      date.setMinutes(date.getMinutes() - (drops.length - i - 1) * 5); // 5 min de diferencia entre cada una

      const testData = {
        compra: drops[i].price,
        venta: drops[i].price + 50,
        casa: 'nacion',
        nombre: 'Oficial',
        moneda: 'USD',
        fechaActualizacion: date,
        timestamp: date
      };

      await this.db.saveRate(testData);
      console.log(`   ${i + 1}. ${drops[i].desc}: $${drops[i].price} - ${date.toLocaleTimeString()}`);
    }

    // Analizar el último precio (después de 3 caídas)
    const result = await this.analytics.analyzeCurrentPrice(drops[drops.length - 1].price);

    console.log('\n📈 Resultado del análisis:');
    console.log(`   Alertas detectadas: ${result.alerts?.length || 0}`);

    if (result.alerts && result.alerts.length > 0) {
      result.alerts.forEach(alert => {
        console.log(`   🚨 ${alert.type}: ${alert.message}`);
      });

      console.log('\n📧 Enviando email de tendencia bajista...');
      await this.notifications.sendAnalysisResult(result);
      console.log('✅ Email enviado con alerta de tendencia\n');
    } else {
      console.log('❌ No se detectó alerta de tendencia consecutiva\n');
    }
  }

  // Test 3: Deadline proximity
  async testDeadlineProximityAlert() {
    console.log('⏰ TEST 3: ALERTA PROXIMIDAD DEADLINE');
    console.log('====================================');

    console.log('📅 Simulando proximidad a fecha límite (6 octubre)...');
    console.log('💡 Nota: La fecha límite está configurada para 6 de octubre de 2025');

    // Calcular días restantes reales
    const deadline = new Date('2025-10-06');
    const today = new Date();
    const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    console.log(`📊 Días restantes reales: ${daysRemaining}`);

    if (daysRemaining <= 7) {
      console.log('🎯 ¡Estamos dentro del período de proximidad!');

      // Usar un precio moderadamente bueno para activar la alerta
      const goodPrice = 1380;
      console.log(`💰 Simulando precio favorable: $${goodPrice}`);

      const result = await this.analytics.analyzeCurrentPrice(goodPrice);

      console.log('\n📈 Resultado del análisis:');
      console.log(`   Alertas detectadas: ${result.alerts?.length || 0}`);

      if (result.alerts && result.alerts.length > 0) {
        result.alerts.forEach(alert => {
          console.log(`   🚨 ${alert.type}: ${alert.message}`);
        });

        console.log('\n📧 Enviando email de proximidad...');
        await this.notifications.sendAnalysisResult(result);
        console.log('✅ Email enviado con alerta de proximidad\n');
      } else {
        console.log('❌ No se detectó alerta de proximidad\n');
      }
    } else {
      console.log(`⏳ Todavía faltan ${daysRemaining} días para la fecha límite`);
      console.log('💡 La alerta de proximidad se activa cuando quedan ≤7 días\n');
    }
  }

  // Test 4: Bi-daily report
  async testBidailyReport() {
    console.log('📊 TEST 4: REPORTE BI-DIARIO');
    console.log('============================');

    console.log('📧 Generando y enviando reporte bi-diario...');

    try {
      await this.notifications.sendBidailyReport(this.db);
      console.log('✅ Reporte bi-diario enviado exitosamente');
      console.log('📬 Revisa el email para ver estadísticas completas\n');
    } catch (error) {
      console.error('❌ Error enviando reporte:', error.message);
    }
  }

  // Ejecutar todos los tests
  async runAllTests() {
    try {
      await this.initialize();

      console.log('🗂️ LIMPIANDO BD DE SIMULACIÓN...');
      // Limpiar BD de testing
      await new Promise((resolve) => {
        this.db.db.run('DELETE FROM dollar_history', resolve);
      });
      console.log('✅ BD limpia\n');

      await this.seedTestData();

      console.log('🚀 EJECUTANDO TESTS DE CARACTERÍSTICAS...\n');

      await this.testZScoreAlert();
      await this.testConsecutiveDropsAlert();
      await this.testDeadlineProximityAlert();
      await this.testBidailyReport();

      console.log('🎉 TESTING COMPLETO FINALIZADO');
      console.log('===============================');
      console.log('📬 Revisa tu email (sanmisanti@gmail.com) para ver todas las notificaciones');
      console.log('💡 Cada test debería haber enviado un email diferente con su respectiva alerta');

    } catch (error) {
      console.error('💥 Error en testing:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Ejecutar tests si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new FeatureTester();
  tester.runAllTests();
}