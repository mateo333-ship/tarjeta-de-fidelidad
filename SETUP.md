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

## 2. Variables de entorno en Vercel

En [vercel.com](https://vercel.com), abre tu proyecto → **Settings →
Environment Variables**, y añade ahí los nueve valores del paso 1 (los
seis `NEXT_PUBLIC_FIREBASE_*` y los tres `FIREBASE_*` del Admin SDK),
usando exactamente los mismos nombres que en `.env.example`. Vercel
acepta bien que `FIREBASE_PRIVATE_KEY` tenga varias líneas, pégala tal
cual viene en el JSON descargado.

Guarda y despliega de nuevo (Deployments → ⋯ → Redeploy) para que la web
recoja las variables nuevas.

## 3. Subir a GitHub y desplegar en Vercel

Ya tienes este paso hecho si estás leyendo esto desde la web en
producción: subes el contenido del proyecto a tu repositorio de GitHub
(Add file → Upload files) y Vercel despliega solo. Repite ese mismo
proceso cada vez que recibas una actualización del código.

## 4. Convertir tu cuenta en cuenta de negocio

El panel `/negocio` solo lo puede usar una cuenta marcada como
"merchant" (negocio). Nadie puede marcarse a sí misma — hace falta la
clave de servicio del paso 1. Hay dos formas de hacerlo:

**Opción A — sin terminal, desde el navegador (recomendada):**

1. Regístrate una vez como cliente normal en `/join`, con tu propio
   correo. Así existe la cuenta que vas a convertir en cuenta de
   negocio.
2. En Vercel, añade una variable de entorno más: `SETUP_SECRET`, con
   cualquier texto secreto que inventes (por ejemplo una frase larga).
   Vuelve a desplegar.
3. Abre `/negocio/activar` en tu web, inicia sesión con esa cuenta y
   escribe el mismo texto secreto. Tu cuenta queda activada al momento,
   sin tocar ninguna terminal.
4. Por seguridad, borra la variable `SETUP_SECRET` de Vercel cuando
   termines (y vuelve a desplegar) — así esa página deja de funcionar
   hasta que la necesites otra vez, por ejemplo para dar acceso a un
   empleado.

**Opción B — con terminal (si en algún momento instalas Node.js y
prefieres este método, o quieres dar acceso a más cuentas sin usar
`SETUP_SECRET`):**

1. En tu terminal, desde esta carpeta:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/tu-clave-de-servicio.json \
     node scripts/setMerchant.mjs tu-correo@ejemplo.com
   ```
2. Entra en `/negocio/login` con ese mismo correo. Ya tienes acceso al
   panel del negocio, con cámara para escanear tarjetas.

## 5. Probarlo de verdad

- Abre `/join` desde tu móvil (o el de un amigo) y crea una tarjeta.
- Abre `/tarjeta` — ahí está el QR de esa persona.
- Desde tu cuenta de negocio, en `/negocio`, pulsa "Abrir cámara" y
  escanea ese QR (puedes usar dos móviles, o el QR en la pantalla de un
  ordenador). El sistema reconoce a la persona al instante y con "+1
  sello" su tarjeta se actualiza sola.

## 6. Activar "Añadir a Google Wallet"

El código de este paso ya está hecho y desplegado — el botón "Añadir a
Google Wallet" en `/tarjeta` funciona en cuanto rellenes 3 variables de
entorno más. Igual que con Firebase, necesitas tu propia cuenta; aquí
están los pasos, uno a uno.

1. **Regístrate como Google Wallet Issuer**: entra en
   [pay.google.com/business/console](https://pay.google.com/business/console/signup)
   con tu cuenta de Google y sigue el registro (nombre del negocio,
   contacto). Al terminar verás tu **Issuer ID** — un número, en la
   esquina superior de la consola. Ese es tu `GOOGLE_WALLET_ISSUER_ID`.
   - Las cuentas nuevas empiezan en modo *prueba*: solo las cuentas de
     Google que añadas como "testers" en esa misma consola pueden
     añadir el pase hasta que Google apruebe tu programa para todo el
     mundo (revisión gratuita, normalmente unos días — pídela desde la
     consola cuando quieras pasar a producción). Añade ahí tu propia
     cuenta de Google como tester para poder probarlo tú primero.
2. **Activa la API en el mismo proyecto de Firebase** (Firebase y
   Google Cloud son el mismo proyecto por debajo, así que reutilizas
   el que ya tienes): ve a
   [console.cloud.google.com/apis/library/walletobjects.googleapis.com](https://console.cloud.google.com/apis/library/walletobjects.googleapis.com),
   confirma que arriba pone el nombre de tu proyecto de Firebase, y
   pulsa **Habilitar**.
3. **Crea una cuenta de servicio para Wallet** (es como la que ya
   creaste para Firebase Admin, pero para esta API): en
   [console.cloud.google.com/iam-admin/serviceaccounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
   (mismo proyecto) → **Crear cuenta de servicio** → dale un nombre
   como `wallet-issuer` → sin necesidad de asignarle ningún rol aquí →
   **Listo**. Entra en esa cuenta creada → pestaña **Claves** → **Añadir
   clave** → **Crear clave nueva** → JSON. Se descarga un `.json`
   (guárdalo fuera de esta carpeta, igual que el de Firebase).
4. **Dale permiso en la consola de Wallet**: vuelve a la consola del
   paso 1 → apartado de usuarios/permisos de la cuenta de emisor
   (*Users*) → añade el correo `client_email` de ese mismo `.json` con
   permiso de **Administrador**.
5. **Variables de entorno en Vercel** (Settings → Environment
   Variables, igual que en el paso 2 de más arriba):
   - `GOOGLE_WALLET_ISSUER_ID`: el número del paso 1.
   - `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL`: el campo `client_email` del
     `.json` del paso 3.
   - `GOOGLE_WALLET_PRIVATE_KEY`: el campo `private_key` de ese mismo
     `.json`, pegado tal cual (con los `\n` incluidos, igual que
     `FIREBASE_PRIVATE_KEY`).
   Redespliega para que la web recoja las variables nuevas.
6. **Pruébalo**: entra en `/tarjeta` con la cuenta de Google que
   añadiste como tester en el paso 1 y pulsa "Añadir a Google Wallet".
   A partir de ahí, cada vez que un sello se añada o se canjee un
   premio, el pase que esa persona ya tiene en su móvil se actualiza
   solo — no hace falta que abra la web para verlo.

## Sobre Apple Wallet

El botón "Añadir a Apple Wallet" sigue desactivado a propósito:
generar un `.pkpass` real y firmado requiere una cuenta **Apple
Developer Program** (99 $/año) y un certificado *Pass Type ID*, que
solo tú puedes crear con tu identidad de Apple. En cuanto tengas esa
cuenta, dímelo y lo añadimos — el resto del código (servidor, base de
datos) ya está preparado para esto, así que es un desarrollo acotado,
no hay que tocar nada más de la app.

Si además quieres que el pase de Apple se actualice solo (como ya pasa
con Google Wallet) hace falta un servicio de notificaciones push de
Apple (APNs) — también es una pieza aparte que añadimos en ese momento.

Mientras tanto, el botón **"Añadir a pantalla de inicio"** ya funciona
de verdad hoy mismo (en Android instala la web como una app con icono
propio; en iPhone explica los dos toques para hacerlo a mano) — es la
alternativa más cercana a una tarjeta de wallet sin depender de esa
cuenta.

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
