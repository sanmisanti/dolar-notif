import sqlite3 from 'sqlite3';
import { config } from './config.js';
import { promises as fs } from 'fs';
import path from 'path';

export class Database {
  constructor() {
    this.db = null;
  }

  async initialize() {
    try {
      const dbDir = path.dirname(config.database.path);
      await fs.mkdir(dbDir, { recursive: true });

      this.db = new sqlite3.Database(config.database.path);

      await this.createTables();
      console.log('Base de datos inicializada correctamente');
    } catch (error) {
      throw new Error(`Error inicializando base de datos: ${error.message}`);
    }
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const query = `
        CREATE TABLE IF NOT EXISTS dollar_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          compra REAL NOT NULL,
          venta REAL NOT NULL,
          casa TEXT NOT NULL,
          nombre TEXT NOT NULL,
          moneda TEXT NOT NULL,
          fecha_actualizacion DATETIME NOT NULL,
          timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_timestamp ON dollar_history(timestamp);
        CREATE INDEX IF NOT EXISTS idx_fecha_actualizacion ON dollar_history(fecha_actualizacion);
      `;

      this.db.exec(query, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async saveRate(data) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO dollar_history 
        (compra, venta, casa, nombre, moneda, fecha_actualizacion, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        data.compra,
        data.venta,
        data.casa,
        data.nombre,
        data.moneda,
        data.fechaActualizacion.toISOString(),
        data.timestamp.toISOString()
      ];

      this.db.run(query, params, function(error) {
        if (error) {
          reject(error);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getRecentRates(limit = 50) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM dollar_history 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;

      this.db.all(query, [limit], (error, rows) => {
        if (error) {
          reject(error);
        } else {
          const rates = rows.map(row => ({
            ...row,
            fecha_actualizacion: new Date(row.fecha_actualizacion),
            timestamp: new Date(row.timestamp),
            created_at: new Date(row.created_at)
          }));
          resolve(rates);
        }
      });
    });
  }

  async getStatistics(days = 7) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as count,
          AVG(compra) as avg_compra,
          MIN(compra) as min_compra,
          MAX(compra) as max_compra,
          AVG(venta) as avg_venta,
          MIN(venta) as min_venta,
          MAX(venta) as max_venta,
          (
            SELECT AVG(compra) FROM (
              SELECT compra FROM dollar_history 
              WHERE timestamp >= datetime('now', '-' || ? || ' days')
              ORDER BY compra 
              LIMIT 1 OFFSET (
                SELECT COUNT(*) FROM dollar_history 
                WHERE timestamp >= datetime('now', '-' || ? || ' days')
              ) / 2
            )
          ) as median_compra
        FROM dollar_history 
        WHERE timestamp >= datetime('now', '-' || ? || ' days')
      `;

      this.db.get(query, [days, days, days], (error, row) => {
        if (error) {
          reject(error);
        } else {
          resolve(row || {});
        }
      });
    });
  }

  async getTodayData() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM dollar_history 
        WHERE DATE(timestamp) = DATE('now', 'localtime')
        ORDER BY timestamp ASC
      `;

      this.db.all(query, (error, rows) => {
        if (error) {
          reject(error);
        } else {
          const rates = rows.map(row => ({
            ...row,
            fecha_actualizacion: new Date(row.fecha_actualizacion),
            timestamp: new Date(row.timestamp),
            created_at: new Date(row.created_at)
          }));
          resolve(rates);
        }
      });
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((error) => {
          if (error) {
            console.error('Error cerrando base de datos:', error);
          }
          resolve();
        });
      });
    }
  }
}