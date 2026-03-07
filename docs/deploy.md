# Deploy y operaciones

## Pre-check local

```bash
npm install
npm run check
npm run test:rules
```

## Deploy completo

```bash
firebase deploy --only firestore:rules,firestore:indexes,hosting --project cashflow-bb84f
```

## Deploy solo frontend

```bash
firebase deploy --only hosting --project cashflow-bb84f
```

## Verificacion

- Abrir `https://cashflow-bb84f.web.app`
- Confirmar cambios en historial de Hosting
- Forzar recarga sin cache (`Ctrl+F5`)

## Nota sobre PWA cache

Si no ves cambios:

1. DevTools > Application > Service Workers > Unregister
2. Application > Storage > Clear site data
3. Recargar
