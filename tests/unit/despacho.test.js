'use strict';

const { crearServicioDespacho, ENVIO_GRATIS_DESDE, TARIFA_RESPALDO } = require('../../src/services/despacho');
const { ErrorNegocio } = require('../../src/errors');

/**
 * Pruebas unitarias con DOBLES DE PRUEBA (mocks).
 * El cliente real del courier se reemplaza por un objeto con jest.fn(),
 * así la prueba es rápida, determinista y no depende de la red.
 */
describe('Servicio de despacho (con mocks)', () => {
  let tarifasClientMock;
  let servicio;

  beforeEach(() => {
    // Setup: se crea un mock nuevo antes de cada prueba
    tarifasClientMock = { obtenerTarifa: jest.fn() };
    servicio = crearServicioDespacho(tarifasClientMock);
  });

  afterEach(() => {
    // Teardown: limpia el historial de llamadas de los mocks
    jest.clearAllMocks();
  });

  test('envío gratis desde $50.000 y NO consulta al courier', async () => {
    const costo = await servicio.cotizar('RM', ENVIO_GRATIS_DESDE);

    expect(costo).toBe(0);
    expect(tarifasClientMock.obtenerTarifa).not.toHaveBeenCalled();
  });

  test('bajo el umbral usa la tarifa del courier (stub)', async () => {
    tarifasClientMock.obtenerTarifa.mockResolvedValue(2990);

    const costo = await servicio.cotizar('RM', ENVIO_GRATIS_DESDE - 1);

    expect(costo).toBe(2990);
    expect(tarifasClientMock.obtenerTarifa).toHaveBeenCalledTimes(1);
    expect(tarifasClientMock.obtenerTarifa).toHaveBeenCalledWith('RM');
  });

  test('si el courier está caído usa la tarifa de respaldo', async () => {
    tarifasClientMock.obtenerTarifa.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(servicio.cotizar('V', 10000)).resolves.toBe(TARIFA_RESPALDO);
  });

  test.each([[-100], ['2990'], [null]])('si el courier responde una tarifa corrupta (%p) usa respaldo', async (tarifa) => {
    tarifasClientMock.obtenerTarifa.mockResolvedValue(tarifa);

    await expect(servicio.cotizar('V', 10000)).resolves.toBe(TARIFA_RESPALDO);
  });

  test('propaga errores de negocio (región sin cobertura)', async () => {
    tarifasClientMock.obtenerTarifa.mockRejectedValue(new ErrorNegocio('Región sin cobertura'));

    await expect(servicio.cotizar('XII', 10000)).rejects.toThrow('Región sin cobertura');
  });
});
