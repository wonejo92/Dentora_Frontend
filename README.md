<div align="center">

# 🦷 Dentora Web

**Panel administrativo y web pública de reservas para clínicas dentales.**

Agenda por doctor, reservas online y gestión de pacientes en un solo lugar.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Hecho en Ecuador](https://img.shields.io/badge/Hecho_en-Ecuador-FFD100)

</div>

---

## 📋 Tabla de contenidos

- [Sobre el proyecto](#-sobre-el-proyecto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologías](#️-tecnologías)
- [Arquitectura](#️-arquitectura)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Variables de entorno](#-variables-de-entorno)
- [Scripts](#-scripts)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Rutas](#️-rutas)
- [Sistema de diseño](#-sistema-de-diseño)
- [Convenciones](#-convenciones)
- [Roadmap](#️-roadmap)
- [Proyectos relacionados](#-proyectos-relacionados)

---

## 💡 Sobre el proyecto

**Dentora** es una plataforma SaaS multi-clínica para la gestión de consultorios dentales en Ecuador. Este repositorio contiene todo lo que se ve en el navegador:

| Parte | Para quién | Estado |
|---|---|---|
| **Panel de la clínica** | Dueños, doctores y recepción | 🚧 En desarrollo |
| **Super-admin** | Equipo de Dentora | ✅ Base lista |
| **Web pública de cada clínica** | Pacientes que reservan cita | 📅 Planificado |
| **Landing de Dentora** | Clínicas que quieren contratar | 📅 Planificado |

Los datos y la lógica de negocio viven en [`dentora-backend`](#-proyectos-relacionados).

---

## ✨ Funcionalidades

- 🔐 **Inicio de sesión seguro**: el token vive en una cookie `httpOnly`, fuera del alcance de JavaScript.
- 🏥 **Registro de clínicas**: autoservicio, con 14 días de prueba gratis.
- 📊 **Resumen**: citas del mes contra el mes anterior, citas por semana, próxima cita y citas de hoy.
- 📅 **Agenda del día**: citas con color por doctor, estados y navegación entre días.
- 🔎 **Buscador de pacientes**: sin tildes y en cualquier orden (`munoz juan` encuentra a *Juan Andrés Muñoz Peña*).
- 🔔 **Campana de reservas**: cuántas reservas online esperan confirmación.
- 👥 **Roles**: dueño, doctor, recepción y asistente, cada uno con sus permisos.
- ⏳ **Aviso de prueba**: días restantes de la prueba gratis, visible solo para el dueño.
- 🚫 **Suspensión automática**: si una clínica se suspende, sus sesiones se cierran al instante.
- 🛡️ **Panel de super-admin**: todas las clínicas con su estado, plan y uso.
- 📱 **Responsive**: funciona en computador, tablet y celular.
- 🇪🇨 **Pensado para Ecuador**: zona horaria `America/Guayaquil`, textos en español y fechas en formato local.

---

## 🛠️ Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| [Next.js](https://nextjs.org) | 16 | Framework (App Router, Server Components, Server Actions, Proxy) |
| [React](https://react.dev) | 19 | Interfaz de usuario |
| [TypeScript](https://www.typescriptlang.org) | 5 | Tipado estático |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Estilos y sistema de diseño |
| [jose](https://github.com/panva/jose) | 6 | Lectura de la expiración del JWT |
| [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | — | Tipografía (vía `next/font`) |
| [ESLint](https://eslint.org) | 9 | Calidad de código |

---

## 🏗️ Arquitectura

Dentora Web sigue el patrón **BFF (Backend for Frontend)**: el navegador **nunca** habla directamente con la API.

```mermaid
sequenceDiagram
    participant N as 🌐 Navegador
    participant W as ⚡ Next.js (servidor)
    participant A as 🦷 dentora-backend

    N->>W: Formulario de login
    W->>A: POST /api/auth/login
    A-->>W: { token, user }
    W-->>N: Cookie httpOnly + redirección al panel

    N->>W: GET /panel (envía la cookie)
    W->>A: GET /api/appointments (Authorization: Bearer …)
    A-->>W: Citas del día
    W-->>N: HTML ya renderizado
```

**¿Por qué así?**

- 🔒 **Más seguro**: un script malicioso no puede robar el token, porque JavaScript no puede leer una cookie `httpOnly`.
- 🌍 **Sin problemas de CORS**: todas las llamadas salen del servidor de Next.
- ⚡ **Más rápido**: las páginas llegan con los datos ya cargados.

**Capas de protección:**

1. **`src/proxy.ts`**: chequeo rápido. Si no hay sesión, redirige al login antes de cargar la página.
2. **`src/lib/dal.ts`**: chequeo real contra el backend en cada página. Valida el rol y cierra la sesión si expiró o si la clínica fue suspendida.
3. **El backend**: valida el token, el rol y la clínica en cada petición. Es la última palabra.

---

## 📦 Requisitos

- [Node.js](https://nodejs.org) **20 o superior**
- [npm](https://www.npmjs.com) 10 o superior
- [`dentora-backend`](#-proyectos-relacionados) corriendo, por defecto en `http://localhost:3000`

---

## 🚀 Instalación

**1. Clona el repositorio**

```bash
git clone https://github.com/TU_USUARIO/dentora-web.git
cd dentora-web
```

**2. Instala las dependencias**

```bash
npm install
```

**3. Configura las variables de entorno**

```bash
cp .env.example .env.local
```

**4. Levanta el backend** (en otra terminal, dentro de `dentora-backend`)

```bash
npm run start:dev
```

**5. Levanta la web**

```bash
npm run dev
```

**6. Abre** 👉 [http://localhost:3001](http://localhost:3001)

> 💡 Para entrar necesitas una cuenta. Créala desde **"Prueba gratis 14 días"** en la pantalla de login.

---

## 🔑 Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `API_URL` | URL del backend. Solo la usa el servidor de Next, nunca el navegador. | `http://localhost:3000/api` |

> ⚠️ `.env.local` está en `.gitignore`. Nunca subas credenciales al repositorio.

---

## 📜 Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto **3001** |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción en el puerto **3001** |
| `npm run lint` | Revisa el código con ESLint |

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/              # Login y registro (pantalla dividida)
│   │   ├── login/
│   │   └── registro/
│   ├── panel/               # Panel de la clínica (requiere sesión)
│   │   ├── layout.tsx       # Menú lateral + encabezado
│   │   ├── page.tsx         # Resumen (dashboard)
│   │   ├── agenda/          # Agenda del día
│   │   ├── pacientes/       # Listado y buscador
│   │   └── …                # Doctores, tratamientos, reportes, ajustes
│   ├── admin/               # Super-admin de Dentora
│   ├── actions/             # Server Actions (sesión y citas)
│   ├── salir/               # Cierre de sesión forzado (sesión expirada o clínica suspendida)
│   ├── globals.css          # Tokens de diseño
│   └── layout.tsx           # Layout raíz y tipografía
├── components/
│   ├── ui/                  # Componentes base: Button, Field, Alert, StatusBadge…
│   └── panel/               # Componentes del panel: menú, usuario, gráfico, íconos…
├── lib/
│   ├── api.ts               # Cliente HTTP hacia el backend (solo servidor)
│   ├── session.ts           # Manejo de la cookie de sesión
│   ├── dal.ts               # Capa de acceso: usuario actual y control de roles
│   ├── time.ts              # Fechas en la zona horaria de la clínica
│   └── types.ts             # Tipos compartidos con la API
└── proxy.ts                 # Protección de rutas (antes llamado middleware)
```

---

## 🗺️ Rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/login` | Público | Inicio de sesión |
| `/registro` | Público | Registro de una clínica nueva |
| `/panel` | Personal de la clínica | Resumen con indicadores y gráfico semanal |
| `/panel/agenda` | Personal de la clínica | Agenda del día (`?fecha=YYYY-MM-DD`) |
| `/panel/pacientes` | Personal de la clínica | Pacientes con buscador (`?q=`) |
| `/panel/doctores` | Personal de la clínica | Doctores y horarios |
| `/panel/tratamientos` | Personal de la clínica | Catálogo de tratamientos |
| `/panel/reportes` | Personal de la clínica | Reportes |
| `/panel/ajustes` | Personal de la clínica | Configuración de la clínica |
| `/admin` | Super-admin | Todas las clínicas |

---

## 🎨 Sistema de diseño

Estilo **"Clínico moderno"** en formato dashboard: menú lateral oscuro, tarjetas blancas con mucho aire y el turquesa asociado a la salud dental.

| Token | Color | Uso |
|---|---|---|
| `brand-500` | ![#0E7490](https://img.shields.io/badge/-%230E7490-0E7490) | Color principal, botones, enlaces |
| `brand-50` | ![#E0F2F5](https://img.shields.io/badge/-%23E0F2F5-E0F2F5) | Fondos suaves y elemento activo del menú |
| `ink` | ![#0F2A33](https://img.shields.io/badge/-%230F2A33-0F2A33) | Texto principal |
| `muted` | ![#5B7580](https://img.shields.io/badge/-%235B7580-5B7580) | Texto secundario |
| `line` | ![#E3ECEF](https://img.shields.io/badge/-%23E3ECEF-E3ECEF) | Bordes |
| `canvas` | ![#F3F7F8](https://img.shields.io/badge/-%23F3F7F8-F3F7F8) | Fondo de página |
| `night-900` | ![#073B49](https://img.shields.io/badge/-%23073B49-073B49) | Menú lateral y tarjetas destacadas |
| `night-800` | ![#11586B](https://img.shields.io/badge/-%2311586B-11586B) | Opción activa del menú |
| `warm-500` | ![#C8693F](https://img.shields.io/badge/-%23C8693F-C8693F) | Línea de promedio y acentos |

**Tipografía:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans), cargada con `next/font` (sin peticiones a Google en el navegador).

Los tokens están definidos en `src/app/globals.css` y se usan como clases de Tailwind: `bg-brand-500`, `text-muted`, `border-line`, etc.

---

## 📐 Convenciones

- **Llamadas a la API**: siempre con `api()` de `src/lib/api.ts`, desde Server Components o Server Actions. Nunca desde el navegador.
- **Páginas protegidas**: llaman a `requireClinicUser()` o `requireSuperAdmin()` de `src/lib/dal.ts`.
- **Colores**: usa los tokens (`brand-*`, `ink`, `muted`, `line`, `canvas`), no colores sueltos.
- **Fechas y horas**: con las funciones de `src/lib/time.ts`, siempre en la zona horaria de la clínica.
- **Textos de la interfaz**: en español.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org) en inglés (`feat:`, `fix:`, `chore:`…).

---

## 🛣️ Roadmap

- [x] Login, registro de clínica y sesión segura
- [x] Panel con agenda del día
- [x] Resumen con indicadores y gráfico semanal
- [x] Listado y buscador de pacientes
- [x] Super-admin con listado de clínicas
- [ ] Tratamientos: catálogo con duración y precio
- [ ] Doctores: perfil y editor visual de horarios
- [ ] Pacientes: crear, editar y ficha con historial
- [ ] Agendar, reprogramar y cambiar el estado de las citas
- [ ] Calendario semanal por doctor
- [ ] Web pública de cada clínica con reserva online
- [ ] Ajustes: logo, colores y reglas de la agenda
- [ ] Landing de Dentora con planes y precios
- [ ] Recordatorios por correo y WhatsApp

---

## 🔗 Proyectos relacionados

| Repositorio | Descripción |
|---|---|
| **dentora-backend** | API REST multi-clínica: NestJS + PostgreSQL + Prisma |
| **dentora-web** | Este repositorio |
| **dentora-app** | App móvil en Flutter *(próximamente)* |

---

<div align="center">

Hecho con 🦷 en Ecuador

**© 2026 Dentora. Todos los derechos reservados.**

</div>
