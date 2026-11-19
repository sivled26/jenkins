# NutriBox API

API REST de pedidos de **NutriBox SpA** (app del Laboratorio CI/CD con Jenkins – ISY1102).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |
| GET | `/api/productos` | Catálogo de boxes |
| GET | `/api/productos/:id` | Detalle de un producto |
| POST | `/api/pedidos` | Crea un pedido (valida RUT, stock, cupón, calcula IVA y despacho) |

```bash
npm install        # dependencias
npm test           # pruebas unitarias + integración
npm run test:coverage
npm run lint       # SAST (ESLint + eslint-plugin-security)
npm run audit:gate # SCA (falla si hay vulnerabilidades críticas)
npm start          # http://localhost:3000
```

Ejemplo de pedido:

```json
POST /api/pedidos
{ "rut": "12.345.678-5", "region": "RM", "items": [{ "productoId": 1, "cantidad": 2 }], "cupon": "BIENVENIDA10" }
```

Pipeline administrado por Jenkins.
