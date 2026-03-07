# Troubleshooting

## `eslint` no reconocido

```bash
npm install
```

## Error al resolver dependencias (`jspdf`, etc.)

```bash
npm install
```

## Error `401` en deploy Firebase

1. Reautenticar:
```bash
firebase logout
firebase login --no-localhost
```
2. Reintentar deploy con proyecto explicito:
```bash
firebase deploy --only hosting --project cashflow-bb84f
```

## Login Firebase falla con "unexpected error"

- Actualizar CLI:
```bash
npm i -g firebase-tools@latest
```
- Usar `--no-localhost` o token CI:
```bash
firebase login:ci --no-localhost
firebase deploy --token "TU_TOKEN" --only hosting --project cashflow-bb84f
```

## No se ven cambios tras deploy

- Verificar URL correcta (`web.app`/`firebaseapp.com`).
- Limpiar Service Worker y cache del navegador.
- Confirmar fecha/hora del ultimo deploy en consola Firebase.
