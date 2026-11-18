'use strict';

/**
 * Repositorio en memoria (equivalente a una BD en memoria para el laboratorio).
 */
const PRODUCTOS = Object.freeze([
  { id: 1, nombre: 'Box Vegana Semanal', precio: 12990, stock: 25 },
  { id: 2, nombre: 'Box Proteica Fit', precio: 15990, stock: 18 },
  { id: 3, nombre: 'Box Frutas de Temporada', precio: 8990, stock: 40 },
  { id: 4, nombre: 'Box Sin Gluten', precio: 13990, stock: 10 },
  { id: 5, nombre: 'Jugo Detox 1L', precio: 3490, stock: 60 },
]);

function findAll() {
  return PRODUCTOS.map((p) => ({ ...p }));
}

function findById(id) {
  const producto = PRODUCTOS.find((p) => p.id === id);
  return producto ? { ...producto } : null;
}

module.exports = { findAll, findById };
