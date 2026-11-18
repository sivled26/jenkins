'use strict';

const { ErrorNegocio } = require('../errors');

const ENVIO_GRATIS_DESDE = 50000;
const TARIFA_RESPALDO = 6990;

/**
 * Servicio de despacho. Recibe por inyección de dependencias un cliente
 * de tarifas (en producción sería la API HTTP de la empresa de courier).
 * Gracias a la inyección, en las pruebas unitarias se reemplaza por un MOCK.
 */
function crearServicioDespacho(tarifasClient) {
  return {
    async cotizar(region, subtotal) {
      if (subtotal >= ENVIO_GRATIS_DESDE) {
        return 0;
      }
      try {
        const tarifa = await tarifasClient.obtenerTarifa(region);
        if (typeof tarifa !== 'number' || tarifa < 0) {
          throw new Error('Tarifa recibida no es válida');
        }
        return tarifa;
      } catch (error) {
        // Errores de negocio (región sin cobertura) se propagan al cliente.
        if (error instanceof ErrorNegocio) throw error;
        // Fallas técnicas del courier (caída, timeout, respuesta corrupta):
        // se usa una tarifa de respaldo para no perder la venta.
        return TARIFA_RESPALDO;
      }
    },
  };
}

module.exports = { crearServicioDespacho, ENVIO_GRATIS_DESDE, TARIFA_RESPALDO };
