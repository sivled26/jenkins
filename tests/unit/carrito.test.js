'use strict';

const { calcularSubtotal, calcularDescuento, calcularTotales, IVA } = require('../../src/services/carrito');
const { ErrorNegocio } = require('../../src/errors');

describe('Carrito - calcularSubtotal()', () => {
  test('suma precio * cantidad de cada línea', () => {
    // Setup
    const lineas = [
      { precio: 10000, cantidad: 2 },
      { precio: 3490, cantidad: 1 },
    ];
    // Execute
    const subtotal = calcularSubtotal(lineas);
    // Assert
    expect(subtotal).toBe(23490);
  });

  test.each([[[]], [null], ['no-es-arreglo']])('lanza error si no hay líneas: %p', (lineas) => {
    expect(() => calcularSubtotal(lineas)).toThrow(ErrorNegocio);
  });

  test.each([[0], [51], [1.5], ['2']])('rechaza cantidad inválida %p (caso borde)', (cantidad) => {
    expect(() => calcularSubtotal([{ precio: 1000, cantidad }])).toThrow(/Cantidad inválida/);
  });

  test('acepta los límites exactos 1 y 50 (caso borde)', () => {
    expect(calcularSubtotal([{ precio: 100, cantidad: 1 }])).toBe(100);
    expect(calcularSubtotal([{ precio: 100, cantidad: 50 }])).toBe(5000);
  });

  test.each([[-1], ['1000'], [undefined]])('rechaza precio inválido %p', (precio) => {
    expect(() => calcularSubtotal([{ precio, cantidad: 1 }])).toThrow(/Precio inválido/);
  });
});

describe('Carrito - calcularDescuento()', () => {
  test('sin cupón no hay descuento', () => {
    expect(calcularDescuento(30000, undefined)).toBe(0);
  });

  test('BIENVENIDA10 aplica 10% (sin importar mayúsculas/espacios)', () => {
    expect(calcularDescuento(30000, '  bienvenida10 ')).toBe(3000);
  });

  test('DUOC5000 descuenta $5.000 si se supera el mínimo', () => {
    expect(calcularDescuento(20000, 'DUOC5000')).toBe(5000);
  });

  test('DUOC5000 falla si la compra está bajo el mínimo (caso borde)', () => {
    expect(() => calcularDescuento(19999, 'DUOC5000')).toThrow(/compra mínima/);
  });

  test('cupón inexistente lanza error', () => {
    expect(() => calcularDescuento(30000, 'GRATIS100')).toThrow('Cupón inválido');
  });

  test('no permite inyección de propiedades del prototipo como cupón', () => {
    expect(() => calcularDescuento(30000, '__proto__')).toThrow('Cupón inválido');
  });
});

describe('Carrito - calcularTotales()', () => {
  test('calcula neto, IVA (19%) y total con despacho', () => {
    const lineas = [{ precio: 10000, cantidad: 3 }]; // 30.000
    const totales = calcularTotales(lineas, 'BIENVENIDA10', 2990);

    expect(IVA).toBe(0.19);
    expect(totales).toEqual({
      subtotal: 30000,
      descuento: 3000,
      neto: 27000,
      iva: 5130,
      despacho: 2990,
      total: 35120,
    });
  });

  test('despacho por defecto es 0', () => {
    const totales = calcularTotales([{ precio: 1000, cantidad: 1 }]);
    expect(totales.despacho).toBe(0);
    expect(totales.total).toBe(1190);
  });
});
