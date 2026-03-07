# Arquitectura

## Stack

- Frontend: React + Vite
- Estilos: TailwindCSS
- Backend gestionado: Firebase (Auth, Firestore, Hosting)
- PWA: vite-plugin-pwa
- PDF: jsPDF + html2canvas

## Estructura principal

- `src/App.jsx`: logica principal de UI (movimientos, deudas, simulador, exportacion)
- `src/firebase.js`: inicializacion Firebase y auth helpers
- `firestore.rules`: reglas de seguridad
- `firebase.json`: configuracion de hosting y firestore

## Flujo funcional

1. Usuario inicia sesion con Google.
2. Se cargan movimientos y deudas de `usuarios/{uid}`.
3. El saldo actual se calcula a partir de movimientos.
4. Al pagar deuda:
   - se marca deuda como pagada
   - se crea movimiento automatico
   - todo se ejecuta en batch atomico

## Decisiones clave

- Datos por usuario en subcolecciones para aislamiento.
- Historial agrupado por ano/mes para usabilidad.
- Reglas Firestore estrictas para evitar acceso cruzado.
- Export PDF orientado a presentacion para usuario final.
