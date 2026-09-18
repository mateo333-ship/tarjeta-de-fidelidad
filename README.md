# Sello Digital

Tarjeta de fidelización digital: el cliente se registra por un QR (o
enlace) en el mostrador, se lleva su tarjeta con un código QR propio, y
el negocio la escanea desde el móvil o la tablet en caja para sumar un
sello con un toque. Todo queda guardado en una base de datos real
(Firebase), con cada tarjeta completamente aislada de las demás.

Marca genérica ("Tu Negocio") a propósito — este proyecto está pensado
para clonarse y personalizarse (nombre, colores, logo) por cada negocio
al que se le venda.

**Para ponerlo en marcha con tus propias cuentas de Firebase / GitHub /
Vercel, sigue [SETUP.md](./SETUP.md).**

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Firebase](https://firebase.google.com): Authentication (email/contraseña) + Firestore
- [`html5-qrcode`](https://github.com/mebjas/html5-qrcode) para el escáner de cámara del panel del negocio
- [`qrcode.react`](https://github.com/zpao/qrcode.react) para el QR de la tarjeta del cliente

## Estructura

```
src/app/                landing, /join, /login, /tarjeta, /negocio/*
src/app/api/            rutas server-side (stamp, redeem, config, lookup) — Admin SDK
src/components/         Ticket, QrScanner, InstallPwaButton
src/lib/                firebase.ts (cliente), firebaseAdmin.ts (servidor), authServer.ts
firestore.rules         reglas de seguridad de la base de datos
scripts/setMerchant.mjs script para dar acceso de negocio a una cuenta
```

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # rellena con tus valores de Firebase, ver SETUP.md
npm run dev
```
