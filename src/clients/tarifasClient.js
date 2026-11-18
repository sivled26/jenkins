'use strict';

const { ErrorNegocio } = require('../errors');

/**
 * Simula la API externa del courier "RapiEnvíos".
 * En un sistema real aquí habría una llamada HTTP (fetch/axios).
 */
const TARIFAS_POR_REGION = new Map([
  ['RM', 2990],
  ['V', 3990],
  ['VI', 4490],
  ['VIII', 4990],
  ['IX', 5490],
  ['X', 5990],
]);

async function obtenerTarifa(region) {
  const codigo = String(region || '').trim().toUpperCase();
  if (!TARIFAS_POR_REGION.has(codigo)) {
    throw new ErrorNegocio(`Región sin cobertura de despacho: ${codigo || '(vacía)'}`);
  }
  return TARIFAS_POR_REGION.get(codigo);
}

function regionesDisponibles() {
  return Array.from(TARIFAS_POR_REGION.keys());
}

module.exports = { obtenerTarifa, regionesDisponibles };
