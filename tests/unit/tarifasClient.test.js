'use strict';

const { obtenerTarifa, regionesDisponibles } = require('../../src/clients/tarifasClient');

describe('Cliente de tarifas (simulación del courier)', () => {
  test('retorna la tarifa de la RM', async () => {
    await expect(obtenerTarifa('rm')).resolves.toBe(2990);
  });

  test('rechaza regiones sin cobertura', async () => {
    await expect(obtenerTarifa('XII')).rejects.toThrow(/sin cobertura/);
  });

  test('rechaza región vacía', async () => {
    await expect(obtenerTarifa(undefined)).rejects.toThrow(/\(vacía\)/);
  });

  test('lista las regiones disponibles', () => {
    expect(regionesDisponibles()).toEqual(expect.arrayContaining(['RM', 'V', 'VIII']));
  });
});
