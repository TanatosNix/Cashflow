# Configuración antes de ejecutar

Esta copia de publicación no incluye credenciales ni historial del proyecto original.

1. Copia `.env.example` a `.env` y configura tu propio proyecto Firebase.
2. Si vas a desplegar, copia `.firebaserc.example` a `.firebaserc` y usa el ID correcto.
3. Instala las dependencias según el README y ejecuta los controles existentes.

Se eliminó de `src/firebase.js` la configuración real usada como alternativa a las variables de entorno. Los informes, `desktop.ini` y los registros de Firebase no forman parte de esta copia. El escáner marca una ruta ficticia del test de reglas como posible clave; fue revisada y no es una credencial.

Las variables `VITE_*` se incorporan al JavaScript del navegador. No sirven para ocultar contraseñas ni secretos de servidor. La protección de Firestore depende de las reglas y la autenticación.

No reemplaces la historia de un repositorio existente con esta carpeta: es una copia de fuentes actuales. Si actualizas el repositorio original, revisa también las versiones anteriores y el correo usado al firmar los commits.
