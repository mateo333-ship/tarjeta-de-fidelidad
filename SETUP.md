# Puesta en marcha — Sello Digital

Esta app ya es funcional de verdad: registro con QR/enlace, tarjeta
propia del cliente, panel del negocio con cámara para escanear y sumar
sellos, y una base de datos donde cada tarjeta está completamente
aislada de las demás. Lo que falta para que funcione en producción son
tus propias cuentas — aquí tienes los pasos, en orden, usando Firebase +
GitHub + Vercel (las cuentas que ya tienes).

## 1. Crear el proyecto de Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) → **Crear proyecto**. Nombre sugerido: `sello-digital` (puedes desactivar Google Analytics, no lo necesitas).
2. **Authentication** → pestaña *Sign-in method* → activa **Correo electrónico/contraseña**.
3. **Firestore Database** → **Crear base de datos** → modo **producción** (las reglas de seguridad ya vienen en `firestore.rules`, no necesitas el modo de prueba) → elige una región cercana (p. ej. `eur3 (europe-west)`).
4. **Reglas de Firestore**: abre la pestaña *Reglas* dentro de Firestore, borra el contenido y pega el de `firestore.rules` (está en la raíz del proyecto). Publica.
   - Alternativa por línea de comandos, si más adelante instalas `firebase-tools`: `npx firebase-tools deploy --only firestore:rules`.
5. **App web**: en *Configuración del proyecto* (el engranaje) → *Tus apps* → añade una app **Web** (icono `</>`), nómbrala `sello-digital-web`. Copia el objeto `firebaseConfig` que te muestra — son los seis valores `NEXT_PUBLIC_FIREBASE_*` de `.env.example`.
6. **Cuenta de servicio** (para el Admin SDK, que usan las rutas `/api/*`): *Configuración del proyecto* → *Cuentas de servicio* → **Generar nueva clave privada**. Se descarga un `.json`.
   - Guárdalo **fuera** de esta carpeta del proyecto (nunca lo subas a GitHub). De ahí sacas `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` (los campos `project_id`, `client_email` y `private_key` del JSON).

## 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena los nueve valores del paso 1. Para probarlo en tu ordenador:

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## 3. Subir a GitHub y desplegar en Vercel

```bash
git init   # si no lo has hecho ya
git add .
git commit -m "Primera versión de Sello Digital"
```

Crea un repositorio nuevo en GitHub y sigue las instrucciones para subir
este commit (`git remote add origin ...` y `git push`).

En [vercel.com](https://vercel.com) → **Add New → Project** → importa ese
repositorio. En *Environment Variables*, añade las mismas nueve variables
de `.env.local` (cópialas y pégalas tal cual, Vercel las separa bien
aunque `FIREBASE_PRIVATE_KEY` tenga varias líneas). Despliega.

## 4. Convertir tu cuenta en cuenta de negocio

El panel `/negocio` solo lo puede usar una cuenta marcada como
"merchant". Nadie puede marcarse a sí mismo — se hace desde tu ordenador
con la clave de servicio del paso 1:

1. Regístrate una vez como cliente normal en `/join` (con tu propio
   correo). Así existe la cuenta que vas a promocionar.
2. En tu terminal, desde esta carpeta:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/tu-clave-de-servicio.json \
     node scripts/setMerchant.mjs tu-correo@ejemplo.com
   ```
3. Entra en `/negocio/login` con ese mismo correo. Ya tienes acceso al
   panel del negocio, con cámara para escanear tarjetas.

## 5. Probarlo de verdad

- Abre `/join` desde tu móvil (o el de un amigo) y crea una tarjeta.
- Abre `/tarjeta` — ahí está el QR de esa persona.
- Desde tu cuenta de negocio, en `/negocio`, pulsa "Abrir cámara" y
  escanea ese QR (puedes usar dos móviles, o el QR en la pantalla de un
  ordenador). El sistema reconoce a la persona al instante y con "+1
  sello" su tarjeta se actualiza sola.

## Sobre Apple Wallet / Google Wallet

Ahora mismo, los botones "Añadir a Apple Wallet" / "Añadir a Google
Wallet" en `/tarjeta` están desactivados a propósito: generar un pase
real y firmado requiere cuentas de desarrollador que solo tú puedes
crear:

- **Apple Wallet**: cuenta Apple Developer (99 $/año) + un certificado
  *Pass Type ID*. Con eso, se genera el `.pkpass` en el servidor (por
  ejemplo con la librería `passkit-generator`) y, si además quieres que
  el pase se actualice solo cuando sumas un sello (sin que el cliente
  tenga que volver a abrir la web), hace falta un servicio web de
  notificaciones push de Apple (APNs) — es un desarrollo aparte, dímelo
  cuando tengas la cuenta y lo añadimos.
- **Google Wallet**: proyecto en Google Cloud + cuenta de **Google
  Wallet Issuer** (Google la revisa y aprueba, puede tardar unos días) +
  una cuenta de servicio con permisos de Wallet Objects API.

Mientras tanto, el botón **"Añadir a pantalla de inicio"** ya funciona
de verdad hoy mismo (en Android instala la web como una app con icono
propio; en iPhone explica los dos toques para hacerlo a mano) — es la
alternativa más cercana a una tarjeta de wallet sin depender de esas
cuentas.

## Limitaciones a tener en cuenta ahora mismo

- **NFC**: el "tap" con NFC solo lo soportan de forma fiable Android +
  Chrome (Web NFC). iPhone no lo permite desde una web. Por eso el flujo
  principal aquí es QR (funciona en cualquier móvil) — el NFC se puede
  añadir más adelante como acceso rápido extra en Android.
- **Un solo negocio por proyecto**: esta versión asume una tarjeta y un
  programa de sellos por base de datos. El nombre del negocio, los
  sellos necesarios y el premio ya se configuran desde `/negocio` (no
  hace falta tocar código para personalizarla), pero para vender esto a
  varios negocios a la vez cada uno necesita su propio proyecto de
  Firebase — o ampliamos el modelo de datos más adelante para que sea
  multi-negocio de verdad dentro de una sola base de datos.
- **Lista de clientes**: el panel muestra los 50 clientes más
  recientes con un buscador por nombre. Si el negocio crece mucho, se
  puede mejorar con paginación o búsqueda por servidor.
