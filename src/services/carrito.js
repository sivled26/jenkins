'use strict';

const { ErrorNegocio } = require('../errors');

const IVA = 0.19;
const MAX_CANTIDAD_POR_ITEM = 50;

// Map (y no objeto literal) para evitar inyección de propiedades tipo "__proto__".
const CUPONES = new Map([
  ['BIENVENIDA10', { tipo: 'porcentaje', valor: 10 }],
  ['DUOC5000', { tipo: 'monto', valor: 5000, minimo: 20000 }],
]);

function calcularSubtotal(lineas) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new ErrorNegocio('El pedido debe tener al menos un producto');
  }
  return lineas.reduce((acc, linea) => {
    const { precio, cantidad } = linea;
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_CANTIDAD_POR_ITEM) {
      throw new ErrorNegocio(`Cantidad inválida: debe ser un entero entre 1 y ${MAX_CANTIDAD_POR_ITEM}`);
    }
    if (typeof precio !== 'number' || precio < 0) {
      throw new ErrorNegocio('Precio inválido');
    }
    return acc + precio * cantidad;
  }, 0);
}

function calcularDescuento(subtotal, codigoCupon) {
  if (!codigoCupon) return 0;
  const cupon = CUPONES.get(String(codigoCupon).trim().toUpperCase());
  if (!cupon) {
    throw new ErrorNegocio('Cupón inválido');
  }
  if (cupon.minimo && subtotal < cupon.minimo) {
    throw new ErrorNegocio(`El cupón requiere una compra mínima de $${cupon.minimo}`);
  }
  if (cupon.tipo === 'porcentaje') {
    return Math.round((subtotal * cupon.valor) / 100);
  }
  return Math.min(cupon.valor, subtotal);
}

function calcularTotales(lineas, codigoCupon, costoDespacho = 0) {
  const subtotal = calcularSubtotal(lineas);
  const descuento = calcularDescuento(subtotal, codigoCupon);
  const neto = subtotal - descuento;
  const iva = Math.round(neto * IVA);
  const total = neto + iva + costoDespacho;
  return { subtotal, descuento, neto, iva, despacho: costoDespacho, total };
}

module.exports = { IVA, calcularSubtotal, calcularDescuento, calcularTotales };
