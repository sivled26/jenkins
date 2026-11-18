'use strict';

const { crearApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;

crearApp().listen(PORT, () => {
  console.log(`NutriBox API escuchando en http://localhost:${PORT}`);
});
