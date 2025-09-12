import { config } from './config.js';

export class Analytics {
  constructor(database) {
    this.db = database;
  }

  calculateStatistics(prices) {
    if (!prices || prices.length === 0) {
      return null;
    }

    const values = prices.map(p => p.compra).sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const median = values.length % 2 === 0 
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];
    
    const q1Index = Math.floor(values.length * 0.25);
    const q3Index = Math.floor(values.length * 0.75);
    
    return {
      mean,
      median,
      stdDev,
      variance,
      min: Math.min(...values),
      max: Math.max(...values),
      q1: values[q1Index],
      q3: values[q3Index],
      count: values.length
    };
  }

  async analyzeCurrentPrice(currentPrice) {
    try {
      const recentData = await this.db.getRecentRates(50);
      
      if (recentData.length < config.alerts.minSamples) {
        return {
          type: 'insufficient_data',
          message: `Se necesitan al menos ${config.alerts.minSamples} muestras. Actual: ${recentData.length}`,
          recommendation: 'wait',
          confidence: 0
        };
      }

      const stats = this.calculateStatistics(recentData);
      const zScore = (currentPrice - stats.mean) / stats.stdDev;
      
      let alerts = [];
      
      if (zScore < -config.alerts.deviationThreshold) {
        alerts.push({
          type: 'statistical_opportunity',
          severity: 'high',
          message: `¡OPORTUNIDAD! Precio ${Math.abs(zScore).toFixed(2)} desviaciones por debajo de la media`,
          recommendation: 'buy_immediate',
          confidence: Math.min(0.95, Math.abs(zScore) / config.alerts.deviationThreshold),
          details: {
            currentPrice,
            mean: stats.mean.toFixed(2),
            deviation: (currentPrice - stats.mean).toFixed(2),
            zScore: zScore.toFixed(2)
          }
        });
      }

      const trendAnalysis = await this.analyzeTrend(recentData.slice(0, 10));
      if (trendAnalysis.alert) {
        alerts.push(trendAnalysis.alert);
      }

      const volatilityAlert = this.analyzeVolatility(stats, currentPrice);
      if (volatilityAlert) {
        alerts.push(volatilityAlert);
      }

      const contextAlert = await this.analyzeContext(currentPrice, stats);
      if (contextAlert) {
        alerts.push(contextAlert);
      }

      return {
        type: 'analysis_complete',
        currentPrice,
        statistics: stats,
        zScore,
        alerts,
        recommendation: this.generateRecommendation(alerts, stats, currentPrice),
        confidence: this.calculateConfidence(alerts, stats)
      };

    } catch (error) {
      console.error('Error en análisis:', error);
      return {
        type: 'error',
        message: error.message,
        recommendation: 'wait',
        confidence: 0
      };
    }
  }

  async analyzeTrend(recentData) {
    if (recentData.length < config.alerts.trendConsecutive) {
      return { trend: 'insufficient_data' };
    }

    const prices = recentData.map(d => d.compra);
    let consecutiveDown = 0;
    let consecutiveUp = 0;

    for (let i = 1; i < Math.min(prices.length, config.alerts.trendConsecutive + 1); i++) {
      if (prices[i] < prices[i-1]) {
        consecutiveDown++;
        consecutiveUp = 0;
      } else if (prices[i] > prices[i-1]) {
        consecutiveUp++;
        consecutiveDown = 0;
      } else {
        break;
      }
    }

    let alert = null;
    
    if (consecutiveDown >= config.alerts.trendConsecutive) {
      const decline = ((prices[0] - prices[consecutiveDown]) / prices[consecutiveDown] * 100).toFixed(2);
      alert = {
        type: 'trend_opportunity',
        severity: 'medium',
        message: `Tendencia bajista sostenida: ${consecutiveDown} caídas consecutivas (-${decline}%)`,
        recommendation: 'buy_soon',
        confidence: 0.7,
        details: {
          consecutiveDeclines: consecutiveDown,
          totalDecline: decline
        }
      };
    }

    return {
      trend: consecutiveDown >= config.alerts.trendConsecutive ? 'downward' : 
             consecutiveUp >= config.alerts.trendConsecutive ? 'upward' : 'stable',
      consecutiveDown,
      consecutiveUp,
      alert
    };
  }

  analyzeVolatility(stats, currentPrice) {
    const volatilityRatio = stats.stdDev / stats.mean;
    
    if (volatilityRatio > 0.03 && Math.abs(currentPrice - stats.mean) > stats.stdDev) {
      return {
        type: 'high_volatility',
        severity: 'low',
        message: `Alta volatilidad detectada (${(volatilityRatio * 100).toFixed(2)}%)`,
        recommendation: 'monitor_closely',
        confidence: 0.6,
        details: {
          volatilityRatio: volatilityRatio.toFixed(4),
          suggestion: 'Momento de mayor riesgo pero posibles oportunidades'
        }
      };
    }
    
    return null;
  }

  async analyzeContext(currentPrice, stats) {
    const today = new Date();
    const targetDate = new Date('2025-10-06');
    const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) {
      return {
        type: 'deadline_passed',
        severity: 'critical',
        message: '¡La fecha límite para comprar ha pasado!',
        recommendation: 'buy_immediate',
        confidence: 1.0
      };
    }
    
    if (daysRemaining <= 7) {
      const percentile25 = stats.q1;
      if (currentPrice <= percentile25) {
        return {
          type: 'deadline_approaching',
          severity: 'high',
          message: `¡Quedan ${daysRemaining} días! Precio en percentil 25 o menor`,
          recommendation: 'buy_immediate',
          confidence: 0.8,
          details: {
            daysRemaining,
            percentile25: percentile25.toFixed(2)
          }
        };
      }
    }
    
    if (daysRemaining <= 14 && currentPrice < stats.mean) {
      return {
        type: 'approaching_deadline',
        severity: 'medium',
        message: `Quedan ${daysRemaining} días. Precio por debajo de la media`,
        recommendation: 'buy_soon',
        confidence: 0.6,
        details: {
          daysRemaining,
          currentVsMean: (currentPrice - stats.mean).toFixed(2)
        }
      };
    }
    
    return null;
  }

  generateRecommendation(alerts, stats, currentPrice) {
    if (!alerts || alerts.length === 0) {
      return currentPrice < stats.mean ? 'monitor' : 'wait';
    }

    const highPriorityAlerts = alerts.filter(a => a.severity === 'high' || a.severity === 'critical');
    const mediumPriorityAlerts = alerts.filter(a => a.severity === 'medium');

    if (highPriorityAlerts.some(a => a.recommendation === 'buy_immediate')) {
      return 'buy_immediate';
    }
    
    if (highPriorityAlerts.length > 0 || mediumPriorityAlerts.some(a => a.recommendation === 'buy_soon')) {
      return 'buy_soon';
    }
    
    if (mediumPriorityAlerts.length > 0) {
      return 'monitor_closely';
    }
    
    return 'monitor';
  }

  calculateConfidence(alerts, stats) {
    if (!alerts || alerts.length === 0) {
      return 0.1;
    }
    
    const avgConfidence = alerts.reduce((sum, alert) => sum + (alert.confidence || 0), 0) / alerts.length;
    const sampleSizeBonus = Math.min(0.2, stats.count / 50 * 0.2);
    
    return Math.min(0.95, avgConfidence + sampleSizeBonus);
  }
}