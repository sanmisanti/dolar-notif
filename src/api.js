import axios from 'axios';
import { config } from './config.js';

export class DolarAPI {
  constructor() {
    this.client = axios.create({
      timeout: config.api.timeout,
      headers: {
        'User-Agent': 'DolarNotif/1.0'
      }
    });
  }

  async fetchOfficialRate() {
    try {
      const response = await this.client.get(config.api.url);
      
      if (!response.data || typeof response.data.compra !== 'number') {
        throw new Error('Respuesta inválida de la API');
      }

      return {
        compra: response.data.compra,
        venta: response.data.venta,
        casa: response.data.casa,
        nombre: response.data.nombre,
        moneda: response.data.moneda,
        fechaActualizacion: new Date(response.data.fechaActualizacion),
        timestamp: new Date()
      };
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout al consultar la API del dólar');
      } else if (error.response) {
        throw new Error(`Error HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error('No se pudo conectar con la API del dólar');
      } else {
        throw new Error(`Error inesperado: ${error.message}`);
      }
    }
  }

  async testConnection() {
    try {
      await this.fetchOfficialRate();
      return true;
    } catch (error) {
      console.error('Test de conexión falló:', error.message);
      return false;
    }
  }
}