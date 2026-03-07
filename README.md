# CashFlow

Aplicación web para control financiero personal con autenticación de Google, registro de movimientos, simulador de ahorro, control de deudas y exportación de resumen en PDF.

## Tabla de contenido

- Descripción general
- Funcionalidades
- Stack tecnológico
- Estructura de datos (Firestore)
- Requisitos
- Instalación y ejecución local
- Variables de entorno
- Scripts disponibles
- Seguridad de Firestore
- Pruebas de reglas
- Despliegue
- Flujo recomendado de trabajo
- Solución de problemas
- Mejoras futuras

## Descripción general

CashFlow permite:

- Registrar ingresos y egresos.
- Editar y eliminar movimientos.
- Organizar historial por año y mes (colapsable).
- Simular ahorro mensual y proyectar saldo.
- Registrar deudas (`Me deben` / `Debo`) y marcarlas como pagadas para impactar el saldo automáticamente.
- Exportar resumen financiero en PDF con diseño visual.

## Funcionalidades

### 1) Autenticación

- Inicio de sesión con Google usando Firebase Auth.
- Cierre de sesión.
- Carga de datos por usuario autenticado.

### 2) Movimientos

- Alta de movimiento:
  - Tipo: `ingreso` o `egreso`
  - Monto (> 0)
  - Descripción (permite texto y emojis)
- Edición de movimiento existente.
- Eliminación de movimiento con confirmación.

### 3) Historial

- Agrupación por `Año > Mes`.
- Secciones colapsables por año y por mes.
- Apertura por defecto del año y mes actuales.

### 4) Simulador

- Entrada de meses a simular.
- Valor mensual de ahorro.
- Cálculo de:
  - Ahorro simulado
  - Saldo proyectado (`saldo actual + ahorro simulado`)

### 5) Deudas

- Registro de deuda:
  - Tipo: `me_deben` o `debo`
  - Estado: `pendiente` / `pagada`
- Al marcar como pagada:
  - Se actualiza deuda
  - Se crea movimiento automático asociado
  - Operación atómica con `writeBatch`

### 6) Exportación PDF

- Desde menú hamburguesa (esquina superior izquierda).
- Incluye:
  - Cabecera y fecha de emisión
  - Resumen (saldo, ingresos, egresos)
  - Tabla de movimientos
- Soporte visual mejorado para emojis en descripciones (dependiente de fuentes del sistema).

## Stack tecnológico

- Frontend: React + Vite
- Estilos: TailwindCSS
- Backend gestionado: Firebase
  - Authentication (Google)
  - Firestore
  - Hosting
- PWA: `vite-plugin-pwa`
- PDF: `jspdf` + `html2canvas`
- Calidad:
  - ESLint
  - Tests de reglas con `@firebase/rules-unit-testing`

## Estructura de datos (Firestore)

Ruta base por usuario:

- `usuarios/{uid}/movimientos/{movimientoId}`
- `usuarios/{uid}/deudas/{deudaId}`

### Documento `movimientos`

```json
{
  "tipo": "ingreso | egreso",
  "monto": 100.5,
  "descripcion": "Texto",
  "fecha": "2026-03-07T10:00:00.000Z"
}
```

### Documento `deudas`

```json
{
  "tipo": "me_deben | debo",
  "monto": 250,
  "descripcion": "Texto",
  "estado": "pendiente | pagada",
  "aplicadaEnSaldo": false,
  "fecha": "2026-03-07T10:00:00.000Z",
  "fechaPago": null
}
```

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Firebase CLI instalada (`npm i -g firebase-tools`) o vía devDependency
- Proyecto Firebase activo con:
  - Authentication (Google) habilitado
  - Firestore habilitado
  - Hosting habilitado

## Instalación y ejecución local

```bash
npm install
npm run dev
```

La app quedará disponible en el host/puerto mostrado por Vite.

## Variables de entorno

Crear archivo `.env` en la raíz (puedes partir de `.env.example`):

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

## Scripts disponibles

- `npm run dev`: entorno de desarrollo
- `npm run lint`: lint del código
- `npm run build`: build de producción
- `npm run preview`: previsualización de build
- `npm run check`: `lint + build`
- `npm run test:rules`: test de reglas Firestore con emulador

## Seguridad de Firestore

Archivos:

- `firestore.rules`
- `firestore.indexes.json`

Las reglas aplican:

- Aislamiento por usuario autenticado (`request.auth.uid == userId`)
- Validación de campos permitidos
- Validación de tipos y rangos (`monto > 0`, estados válidos, etc.)

## Pruebas de reglas

Ejecutar:

```bash
npm run test:rules
```

Se valida, entre otros casos:

- Usuario no autenticado bloqueado.
- Usuario A no puede leer/escribir datos de usuario B.
- Creación/actualización válida en estructuras permitidas.
- Rechazo de tipos/estados inválidos.

## Despliegue

### 1) Verificar calidad

```bash
npm run check
npm run test:rules
```

### 2) Desplegar hosting + reglas + índices

```bash
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

## Flujo recomendado de trabajo

1. Crear rama de feature.
2. Implementar cambio.
3. Ejecutar `npm run check`.
4. Ejecutar `npm run test:rules`.
5. Validar manualmente en `npm run dev`.
6. Desplegar.

## Solución de problemas

### `eslint` no reconocido

```bash
npm install
```

### Error de resolución de dependencias (`jspdf`, etc.)

```bash
npm install
```

### Emojis no se ven igual en PDF

- El render depende de fuentes disponibles en el sistema operativo.
- En algunos equipos ciertos emojis pueden verse distintos o no renderizar color.

### Reglas Firestore bloquean operaciones válidas

- Revisar estructura exacta del documento enviado.
- Confirmar que no se estén enviando campos extra fuera de los permitidos por reglas.

## Mejoras futuras

- Filtros avanzados por fecha/tipo/categoría.
- Exportación PDF por rango de fechas.
- Dashboard con métricas y gráficas.
- Tests de frontend (lógica de saldo, simulador, deudas).
- Internacionalización (i18n).
