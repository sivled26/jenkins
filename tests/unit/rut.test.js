'use strict';

const { validarRut, calcularDv, formatearRut } = require('../../src/services/rut');

describe('Servicio RUT - validarRut()', () => {
  test.each([
    ['12.345.678-5'],
    ['12345678-5'],
    ['123456785'],
    ['11.111.111-1'],
    ['7.654.321-6'],
    ['10.000.013-K'],
    ['10.000.013-k'], // DV en minúscula
    ['10000004-0'], // DV cero
  ])('acepta RUT válido %s', (rut) => {
    expect(validarRut(rut)).toBe(true);
  });

  test.each([
    ['12.345.678-9', 'dígito verificador incorrecto'],
    ['1234-5', 'cuerpo demasiado corto'],
    ['123456789-0', 'cuerpo demasiado largo'],
    ['12.345.67A-5', 'contiene letras en el cuerpo'],
    ['', 'string vacío'],
    ['   ', 'solo espacios'],
  ])('rechaza RUT inválido %s (%s)', (rut) => {
    expect(validarRut(rut)).toBe(false);
  });

  test.each([[null], [undefined], [12345678], [{}]])('rechaza valores que no son string: %p', (valor) => {
    expect(validarRut(valor)).toBe(false);
  });
});

describe('Servicio RUT - utilidades', () => {
  test('calcularDv devuelve K cuando corresponde', () => {
    expect(calcularDv('10000013')).toBe('K');
  });

  test('formatearRut normaliza puntos y mayúsculas', () => {
    expect(formatearRut('10.000.013-k')).toBe('10000013-K');
  });
});
