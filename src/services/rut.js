'use strict';

/**
 * Validación de RUT chileno (algoritmo módulo 11).
 * Acepta formatos: 12.345.678-5 | 12345678-5 | 123456785 | 10.000.013-k
 */

function limpiarRut(rut) {
  return String(rut).replace(/[.\s-]/g, '').toUpperCase();
}

function calcularDv(cuerpo) {
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo.charAt(i)) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

function validarRut(rut) {
  if (typeof rut !== 'string' || rut.trim() === '') return false;
  const limpio = limpiarRut(rut);
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return calcularDv(cuerpo) === dv;
}

function formatearRut(rut) {
  const limpio = limpiarRut(rut);
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

module.exports = { validarRut, calcularDv, limpiarRut, formatearRut };
