<h1 align="center">CashFlow</h1>
<p align="center">
  Control financiero personal con Firebase, React y exportacion PDF.
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-4-646CFF?logo=vite&logoColor=white">
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green">
</p>

## Demo

- Produccion: `https://cashflow-bb84f.web.app`

## Features

- Login con Google (Firebase Auth).
- Registro de ingresos y egresos.
- Edicion y eliminacion de movimientos.
- Historial colapsable por ano y mes.
- Simulador de ahorro con saldo proyectado.
- Modulo de deudas (`Me deben` / `Debo`) con impacto en saldo al marcar pago.
- Exportacion de resumen financiero en PDF.
- Reglas de seguridad Firestore por usuario.

## Quick Start

```bash
npm install
npm run dev
```

## Variables de entorno

Crea `.env` usando `.env.example`:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## Scripts

- `npm run dev`: desarrollo local
- `npm run lint`: analisis estatico
- `npm run build`: build de produccion
- `npm run preview`: preview del build
- `npm run check`: lint + build
- `npm run test:rules`: tests de reglas Firestore

## Deploy

```bash
npm run check
npm run test:rules
firebase deploy --only firestore:rules,firestore:indexes,hosting --project cashflow-bb84f
```

## Documentacion

- [Arquitectura](docs/architecture.md)
- [Modelo de datos Firestore](docs/firestore-data-model.md)
- [Seguridad y reglas](docs/security-rules.md)
- [Deploy y operaciones](docs/deploy.md)
- [Troubleshooting](docs/troubleshooting.md)

## Roadmap corto

- Filtros avanzados por fecha/tipo.
- Exportacion PDF por rango.
- Dashboard con metricas.
- Tests de frontend (Vitest + RTL).

## Licencia

MIT
