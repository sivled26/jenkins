'use strict';

const request = require('supertest');
const { crearApp } = require('../../src/app');

/**
 * Pruebas de INTEGRACIÓN de la API REST (supertest levanta la app en memoria,
 * sin abrir un puerto real). Validan rutas + validaciones + manejo de errores.
 */
describe('API NutriBox - endpoints públicos', () => {
  const app = crearApp();

  test('GET /health responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', servicio: 'nutribox-api' });
  });

  test('no expone la cabecera X-Powered-By y agrega cabeceras de seguridad (helmet)', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('GET /api/productos lista el catálogo', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('precio');
  });

  test('GET /api/productos/:id retorna un producto', async () => {
    const res = await request(app).get('/api/productos/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  test('GET /api/productos/:id inexistente => 404', async () => {
    const res = await request(app).get('/api/productos/999');
    expect(res.status).toBe(404);
  });

  test('GET /api/productos/:id con id no numérico => 400', async () => {
    const res = await request(app).get('/api/productos/abc');
    expect(res.status).toBe(400);
  });

  test('ruta inexistente => 404', async () => {
    const res = await request(app).get('/admin');
    expect(res.status).toBe(404);
  });
});

describe('API NutriBox - POST /api/pedidos', () => {
  const app = crearApp();
  const pedidoValido = {
    rut: '12.345.678-5',
    region: 'rm',
    items: [{ productoId: 1, cantidad: 2 }],
    cupon: 'BIENVENIDA10',
  };

  test('crea un pedido válido y calcula totales', async () => {
    const res = await request(app).post('/api/pedidos').send(pedidoValido);

    expect(res.status).toBe(201);
    expect(res.body.pedido).toMatchObject({
      rut: '12345678-5',
      region: 'RM',
      subtotal: 25980,
      descuento: 2598,
      neto: 23382,
      iva: 4443,
      despacho: 2990,
      total: 30815,
    });
  });

  test.each([
    [{ ...pedidoValido, rut: '12.345.678-0' }, /RUT inválido/],
    [{ ...pedidoValido, items: [] }, /al menos un producto/],
    [{ ...pedidoValido, items: [{ productoId: 99, cantidad: 1 }] }, /no existe/],
    [{ ...pedidoValido, items: [{ productoId: 4, cantidad: 11 }] }, /Stock insuficiente/],
    [{ ...pedidoValido, items: [{ productoId: 1, cantidad: 0 }] }, /Cantidad inválida/],
    [{ ...pedidoValido, cupon: 'FALSO' }, /Cupón inválido/],
    [{ ...pedidoValido, region: 'XII' }, /sin cobertura/],
  ])('rechaza pedido inválido con 400 (%#)', async (body, mensaje) => {
    const res = await request(app).post('/api/pedidos').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(mensaje);
  });

  test('rechaza JSON mal formado con 400 sin exponer detalles internos', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Content-Type', 'application/json')
      .send('{"rut": ');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Solicitud inválida' });
  });

  test('rechaza payloads mayores a 10kb (413)', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send({ ...pedidoValido, relleno: 'x'.repeat(11 * 1024) });
    expect(res.status).toBe(413);
  });
});

describe('API NutriBox - dependencias reemplazadas (stubs y spies)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('usa el servicio de despacho inyectado (stub)', async () => {
    const despachoStub = { cotizar: jest.fn().mockResolvedValue(0) };
    const app = crearApp({ servicioDespacho: despachoStub });

    const res = await request(app)
      .post('/api/pedidos')
      .send({ rut: '11.111.111-1', region: 'V', items: [{ productoId: 5, cantidad: 1 }] });

    expect(res.status).toBe(201);
    expect(res.body.pedido.despacho).toBe(0);
    expect(despachoStub.cotizar).toHaveBeenCalledWith('V', 3490);
  });

  test('error inesperado => 500 genérico y se registra en el log (spy)', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const repoRoto = {
      findAll: jest.fn(() => {
        throw new Error('Base de datos no disponible');
      }),
      findById: jest.fn(),
    };
    const app = crearApp({ productosRepo: repoRoto });

    const res = await request(app).get('/api/productos');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error interno del servidor' });
    expect(JSON.stringify(res.body)).not.toMatch(/Base de datos/);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
