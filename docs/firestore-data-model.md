# Modelo de datos Firestore

## Rutas

- `usuarios/{uid}/movimientos/{movimientoId}`
- `usuarios/{uid}/deudas/{deudaId}`

## Documento movimientos

```json
{
  "tipo": "ingreso | egreso",
  "monto": 100.5,
  "descripcion": "Texto libre",
  "fecha": "2026-03-07T10:00:00.000Z"
}
```

## Documento deudas

```json
{
  "tipo": "me_deben | debo",
  "monto": 250,
  "descripcion": "Texto libre",
  "estado": "pendiente | pagada",
  "aplicadaEnSaldo": false,
  "fecha": "2026-03-07T10:00:00.000Z",
  "fechaPago": null
}
```

## Reglas de negocio

- `monto` siempre debe ser mayor a 0.
- Al marcar deuda pagada se debe registrar movimiento asociado.
- `aplicadaEnSaldo` evita doble impacto monetario.
