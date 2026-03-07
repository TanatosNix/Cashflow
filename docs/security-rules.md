# Seguridad y reglas Firestore

## Objetivo

Garantizar que cada usuario solo pueda leer y modificar sus propios datos.

## Archivo

- `firestore.rules`

## Principios aplicados

- Requiere autenticacion (`request.auth != null`).
- Verifica propietario (`request.auth.uid == userId`).
- Restringe campos permitidos por documento.
- Valida tipos y estados permitidos.
- Bloquea lectura/escritura fuera de `usuarios/{uid}`.

## Validaciones destacadas

- Movimiento:
  - `tipo`: `ingreso` o `egreso`
  - `monto`: number > 0
  - `descripcion`: string (max 200)
- Deuda:
  - `tipo`: `me_deben` o `debo`
  - `estado`: `pendiente` o `pagada`
  - `aplicadaEnSaldo`: boolean

## Tests automáticos

Script:

```bash
npm run test:rules
```

Valida escenarios de permisos y estructura.
