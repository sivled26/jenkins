'use strict';

const express = require('express');
const helmet = require('helmet');

const { version } = require('../package.json');
const { ErrorNegocio } = require('./errors');
const { validarRut, formatearRut } = require('./services/rut');
const { calcularSubtotal, calcularTotales } = require('./services/carrito');
const { crearServicioDespacho } = require('./services/despacho');
const tarifasClient = require('./clients/tarifasClient');
const productosRepoPorDefecto = require('./repositories/productosRepo');

/**
 * Fábrica de la aplicación. Recibe sus dependencias para poder
 * reemplazarlas por stubs/mocks en las pruebas de integración.
 */
function crearApp({
  productosRepo = productosRepoPorDefecto,
  servicioDespacho = crearServicioDespacho(tarifasClient),
} = {}) {
  const app = express();

  // --- Controles de seguridad básicos (hardening) ---
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', servicio: 'nutribox-api', version });
  });

  app.get('/api/productos', (req, res) => {
    res.json(productosRepo.findAll());
  });

  app.get('/api/productos/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new ErrorNegocio('El id de producto debe ser un entero positivo');
      }
      const producto = productosRepo.findById(id);
      if (!producto) {
        throw new ErrorNegocio('Producto no encontrado', 404);
      }
      res.json(producto);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/pedidos', async (req, res, next) => {
    try {
      const { rut, region, items, cupon } = req.body || {};

      if (!validarRut(rut)) {
        throw new ErrorNegocio('RUT inválido');
      }
      if (!Array.isArray(items) || items.length === 0) {
        throw new ErrorNegocio('El pedido debe tener al menos un producto');
      }

      const lineas = items.map(({ productoId, cantidad } = {}) => {
        const producto = productosRepo.findById(Number(productoId));
        if (!producto) {
          throw new ErrorNegocio(`Producto ${productoId} no existe`);
        }
        if (Number.isInteger(cantidad) && cantidad > producto.stock) {
          throw new ErrorNegocio(`Stock insuficiente para "${producto.nombre}"`);
        }
        return { productoId: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad };
      });

      const subtotal = calcularSubtotal(lineas);
      const costoDespacho = await servicioDespacho.cotizar(region, subtotal);
      const totales = calcularTotales(lineas, cupon, costoDespacho);

      res.status(201).json({
        pedido: {
          rut: formatearRut(rut),
          region: String(region).toUpperCase(),
          lineas,
          ...totales,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // 404 para rutas inexistentes
  app.use((req, res) => {
    res.status(404).json({ error: 'Recurso no encontrado' });
  });

  // Manejador central de errores: nunca expone el stack trace al cliente.
  app.use((err, req, res, _next) => {
    if (err instanceof ErrorNegocio) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err.status && err.status >= 400 && err.status < 500) {
      return res.status(err.status).json({ error: 'Solicitud inválida' });
    }
    console.error('[ERROR]', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

module.exports = { crearApp };
