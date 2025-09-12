export class Dashboard {
  constructor(monitorService) {
    this.monitor = monitorService;
  }

  async showStatus() {
    try {
      const status = await this.monitor.getStatus();
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 DASHBOARD - MONITOR DÓLAR OFICIAL');
      console.log('='.repeat(60));
      
      if (!status.isInitialized) {
        console.log('❌ Sistema no inicializado');
        return;
      }

      console.log(`💰 Precio Actual: $${status.currentPrice || 'N/A'}`);
      console.log(`🕐 Última Actualización: ${status.lastUpdate ? status.lastUpdate.toLocaleString('es-AR') : 'N/A'}`);
      console.log(`📅 Consultas Hoy: ${status.todayChecks}`);
      
      if (status.weeklyStats && status.weeklyStats.count > 0) {
        console.log('\n📈 ESTADÍSTICAS SEMANALES:');
        console.log(`   Media: $${status.weeklyStats.avg_compra?.toFixed(2) || 'N/A'}`);
        console.log(`   Mín/Máx: $${status.weeklyStats.min_compra?.toFixed(2) || 'N/A'} / $${status.weeklyStats.max_compra?.toFixed(2) || 'N/A'}`);
        console.log(`   Muestras: ${status.weeklyStats.count}`);
      }

      console.log('\n🎯 OBJETIVO DE COMPRA:');
      const today = new Date();
      const targetDate = new Date('2025-10-06');
      const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
      
      console.log(`   Monto: USD $100`);
      console.log(`   Fecha límite: 6 de octubre de 2025`);
      console.log(`   Días restantes: ${Math.max(0, daysRemaining)}`);
      
      if (status.error) {
        console.log(`\n❌ Error: ${status.error}`);
      }
      
      console.log('='.repeat(60));
      
    } catch (error) {
      console.error('❌ Error mostrando dashboard:', error.message);
    }
  }

  async showHistorical(days = 7) {
    try {
      console.log(`\n📊 HISTÓRICO ÚLTIMOS ${days} DÍAS`);
      console.log('='.repeat(50));
      
      const data = await this.monitor.getHistoricalData(days);
      
      if (data.length === 0) {
        console.log('❌ No hay datos históricos disponibles');
        return;
      }

      console.log('Fecha\t\t\tCompra\tVenta');
      console.log('-'.repeat(50));
      
      data.slice(-20).forEach(item => {
        const date = item.timestamp.toLocaleString('es-AR').substring(0, 16);
        console.log(`${date}\t$${item.compra}\t$${item.venta}`);
      });
      
      const prices = data.map(d => d.compra);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      console.log('-'.repeat(50));
      console.log(`Promedio: $${avg.toFixed(2)} | Mín: $${min.toFixed(2)} | Máx: $${max.toFixed(2)}`);
      
    } catch (error) {
      console.error('❌ Error mostrando histórico:', error.message);
    }
  }

  async showAnalysis() {
    try {
      console.log('\n🧠 ANÁLISIS ACTUAL');
      console.log('='.repeat(50));
      
      const analysis = await this.monitor.runAnalysis();
      
      if (analysis.type === 'error') {
        console.log(`❌ Error: ${analysis.message}`);
        return;
      }

      if (analysis.type === 'insufficient_data') {
        console.log(`⚠️ ${analysis.message}`);
        return;
      }

      console.log(`💰 Precio Analizado: $${analysis.currentPrice}`);
      console.log(`🎯 Recomendación: ${this.getRecommendationText(analysis.recommendation)}`);
      console.log(`📊 Confianza: ${(analysis.confidence * 100).toFixed(0)}%`);
      
      if (analysis.statistics) {
        console.log('\n📈 ESTADÍSTICAS:');
        console.log(`   Media: $${analysis.statistics.mean.toFixed(2)}`);
        console.log(`   Mediana: $${analysis.statistics.median.toFixed(2)}`);
        console.log(`   Desv. Std: ${analysis.statistics.stdDev.toFixed(2)}`);
        console.log(`   Z-Score: ${analysis.zScore?.toFixed(2) || 'N/A'}`);
      }

      if (analysis.alerts && analysis.alerts.length > 0) {
        console.log('\n🚨 ALERTAS:');
        analysis.alerts.forEach((alert, index) => {
          const emoji = this.getSeverityEmoji(alert.severity);
          console.log(`   ${index + 1}. ${emoji} ${alert.message}`);
          console.log(`      Confianza: ${(alert.confidence * 100).toFixed(0)}%`);
        });
      } else {
        console.log('\n✅ Sin alertas activas');
      }
      
    } catch (error) {
      console.error('❌ Error mostrando análisis:', error.message);
    }
  }

  async showTodaySummary() {
    try {
      console.log('\n📅 RESUMEN DEL DÍA');
      console.log('='.repeat(40));
      
      const todayData = await this.monitor.db.getTodayData();
      
      if (todayData.length === 0) {
        console.log('📭 Sin datos para hoy');
        return;
      }

      const prices = todayData.map(d => d.compra);
      const opening = prices[0];
      const current = prices[prices.length - 1];
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const change = current - opening;
      const changePercent = (change / opening * 100);

      console.log(`🕐 Consultas realizadas: ${todayData.length}`);
      console.log(`📊 Apertura: $${opening.toFixed(2)}`);
      console.log(`💰 Actual: $${current.toFixed(2)}`);
      console.log(`📈 Máximo: $${max.toFixed(2)}`);
      console.log(`📉 Mínimo: $${min.toFixed(2)}`);
      
      const changeEmoji = change >= 0 ? '📈' : '📉';
      console.log(`${changeEmoji} Variación: $${change.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
      
      const hourlyData = this.groupByHour(todayData);
      console.log('\n⏰ POR HORA:');
      hourlyData.forEach(({ hour, count, avgPrice, change }) => {
        const changeEmoji = change >= 0 ? '↗️' : '↘️';
        console.log(`   ${hour}:00 - $${avgPrice.toFixed(2)} (${count} consultas) ${change !== 0 ? changeEmoji + change.toFixed(2) : ''}`);
      });
      
    } catch (error) {
      console.error('❌ Error mostrando resumen:', error.message);
    }
  }

  groupByHour(data) {
    const hourlyMap = new Map();
    
    data.forEach(item => {
      const hour = item.timestamp.getHours();
      if (!hourlyMap.has(hour)) {
        hourlyMap.set(hour, []);
      }
      hourlyMap.get(hour).push(item.compra);
    });

    const result = [];
    for (const [hour, prices] of hourlyMap.entries()) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const prevHour = result[result.length - 1];
      const change = prevHour ? avgPrice - prevHour.avgPrice : 0;
      
      result.push({
        hour,
        count: prices.length,
        avgPrice,
        change
      });
    }
    
    return result.sort((a, b) => a.hour - b.hour);
  }

  getRecommendationText(recommendation) {
    const texts = {
      'buy_immediate': '🔴 COMPRAR INMEDIATAMENTE',
      'buy_soon': '🟠 COMPRAR PRONTO',
      'monitor_closely': '🟡 MONITOREAR DE CERCA',
      'monitor': '🔵 SEGUIR MONITOREANDO',
      'wait': '⚫ ESPERAR'
    };
    return texts[recommendation] || recommendation;
  }

  getSeverityEmoji(severity) {
    const emojis = {
      'critical': '🚨',
      'high': '⚠️',
      'medium': '⚡',
      'low': 'ℹ️'
    };
    return emojis[severity] || 'ℹ️';
  }

  showHelp() {
    console.log('\n📖 COMANDOS DISPONIBLES:');
    console.log('='.repeat(40));
    console.log('status     - Mostrar estado actual');
    console.log('history    - Mostrar histórico (7 días)');
    console.log('analysis   - Ejecutar análisis actual');
    console.log('today      - Resumen del día');
    console.log('test       - Verificar notificaciones');
    console.log('monitor    - Ejecutar monitoreo manual');
    console.log('help       - Mostrar esta ayuda');
    console.log('exit       - Salir del programa');
    console.log('='.repeat(40));
  }
}