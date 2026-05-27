# Freereterria - Sistema Profesional de Inventario & POS 🛠️

Freereterria es un sistema web completo, profesional y de alto rendimiento diseñado para la gestión del inventario, Kardex, compras a proveedores y facturación en Punto de Venta (POS) para una ferretería. Cuenta con una estética premium con soporte para modo oscuro, alertas en tiempo real de bajo stock, y exportador analítico de reportes.

## 🚀 Tecnologías Utilizadas

### Frontend
- **React (v19)** + **Vite** (SPA rápido y ultra liviano)
- **Tailwind CSS (v3)** (Estilos responsivos de alta fidelidad, animaciones suaves y soporte de Dark Mode)
- **Recharts** (Gráficos analíticos e interactivos de facturación y stock)
- **Lucide Icons** (Iconografía moderna y consistente)
- **Axios** (Cliente HTTP con inyección automática de token JWT)
- **Canvas Confetti** (Micro-animaciones interactivas para celebraciones de caja)

### Backend
- **Node.js** + **Express** (Arquitectura REST modular y limpia por controladores)
- **Prisma ORM** (Modelado relacional y transacciones seguras de base de datos)
- **Neon PostgreSQL** (Base de datos en la nube de alta disponibilidad)
- **JWT (JsonWebToken)** + **BcryptJS** (Autenticación y cifrado seguro de contraseñas por Roles)
- **Morgan** + **Logger Personalizado** (Auditoría forense de operaciones y logs del sistema)

---

## 🎨 Características Destacadas

1. **Dashboard Analítico**: Tarjetas dinámicas de resumen (Total productos, alertas de stock bajo, ventas del día y facturación mensual) acompañadas de gráficos de área interactivos y distribución de stock.
2. **Punto de Venta (POS) Inteligente**: Diseñado para una facturación rápida con carrito dinámico, cálculo de impuestos (IGV 18%), descuentos y un **simulador de lector de código de barras por SKU** de alta velocidad. Generación de boleta electrónica imprimible (estilos `@media print` nativos) con confeti de éxito.
3. **Control Logístico de Compras**: Formulario dinámico para registrar compras de reabastecimiento a proveedores que incrementa el stock de forma atómica.
4. **Kardex Físico Histórico**: Registro detallado de todas las entradas (compras), salidas (ventas) y ajustes manuales indicando fecha, responsable, cantidad y justificación técnica.
5. **Reportes y Consola de Auditoría**: Descarga de informes en Excel/CSV de Ventas, Catálogo, Kardex e Utilidades. Consola estilo terminal para administradores que permite leer los logs del sistema en vivo.
6. **Seguridad y Roles**: Rutas y vistas protegidas según rol de usuario (`ADMIN` vs `EMPLOYEE`).

---

## 💻 Instalación y Configuración

### Requisitos Previos
- Node.js (versión 18 o superior)
- Conexión a Internet (para Neon PostgreSQL)

### Pasos de Arranque
1. Clona el repositorio en tu máquina local.
2. Abre la carpeta raíz del proyecto y haz doble clic sobre el script de inicio rápido de Windows:
   ```bash
   start-all.bat
   ```
   *Esto iniciará concurrentemente el servidor del Backend (puerto 5000) y el servidor del Frontend (puerto 5173).*

### Credenciales de Prueba (Demo)
- **Administrador (Acceso Completo + Reportes + Logs)**:
  - **Email**: `admin@freereterria.com`
  - **Contraseña**: `admin123`
- **Empleado de Caja (Acceso a POS y Almacén)**:
  - **Email**: `empleado@freereterria.com`
  - **Contraseña**: `empleado123`

---

## 📂 Estructura del Proyecto

```
freereterria/
├── start-all.bat               # Script Windows para inicio rápido concurrente
├── backend/                    # Servidor Express & Prisma
│   ├── prisma/
│   │   ├── schema.prisma       # Esquema ORM de PostgreSQL
│   │   └── seed.js             # Poblado inicial de catálogo ferretero
│   └── src/
│       ├── controllers/        # Controladores lógicos de endpoints
│       ├── middleware/         # Autenticación JWT y validadores de rol
│       └── routes/             # Enrutamiento de la API REST (/api/*)
└── frontend/                   # Cliente SPA React
    └── src/
        ├── components/         # Layout, Sidebar, Navbar, Modales, Toast
        ├── context/            # Proveedores de sesión y tema oscuro
        └── pages/              # Interfaces (POS, Dashboard, Kardex, etc.)
```

---

Desarrollado con ❤️ para **Freereterria**.
