'use strict';

/**
 * Error de negocio: representa una solicitud inválida del cliente
 * (RUT mal formado, cupón inexistente, región sin cobertura, etc.).
 * El middleware de errores lo traduce a una respuesta HTTP 4xx.
 */
class ErrorNegocio extends Error {
  constructor(mensaje, status = 400) {
    super(mensaje);
    this.name = 'ErrorNegocio';
    this.status = status;
  }
}

module.exports = { ErrorNegocio };
