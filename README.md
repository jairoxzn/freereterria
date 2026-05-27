# Freereterria - Sistema Profesional de Inventario & POS 🛠️

Freereterria es un sistema web completo, profesional y de alto rendimiento diseñado para la gestión del inventario, Kardex, compras a proveedores y facturación en Punto de Venta (POS) para una ferretería. 

Esta es la **arquitectura unificada monolítica** del sistema, donde tanto el backend (API REST Node/Express/Prisma) como el frontend (React SPA) se ejecutan bajo **un solo proyecto y un único puerto (5000)**, sin subcarpetas de subproyectos separados ni CORS, logrando una velocidad y simplicidad de ejecución sobresalientes.

---

## 🚀 Tecnologías Utilizadas

- **Servidor API REST**: Node.js + Express (API REST limpia, control de sesiones, logs).
- **Base de Datos**: PostgreSQL en la nube (Neon) mediante **Prisma ORM** con soporte transaccional seguro.
- **Frontend SPA**: React 18 + Tailwind CSS + Lucide Icons + ApexCharts (para analíticas hermosas) servido directamente de forma estática por Express.
- **Seguridad**: Autenticación JWT y encriptación de contraseñas por roles (`ADMIN` / `EMPLOYEE`) mediante `bcryptjs`.
- **Logs y Auditoría**: Logger local integrado que registra eventos en consola y en un archivo de logs local (`/logs/system.log`).

---

## 🎨 Características Clave

1. **Dashboard Analítico**: Estadísticas rápidas y gráficos de área interactivos de facturación de caja en tiempo real.
2. **Punto de Venta (POS)**: Diseñado para una facturación rápida con carrito de compras reactivo, impuestos (IGV 18%), descuentos y un **simulador de lector de código de barras por SKU**. Generación de boleta electrónica imprimible nativa con fuegos artificiales de confeti en cada venta exitosa.
3. **Control Logístico de Compras**: Formulario para registrar facturas de reabastecimiento de proveedores que incrementa el stock de forma atómica en base a transacciones relacionales seguras.
4. **Kardex Histórico**: Registro cronológico forense de todas las entradas (compras), salidas (ventas) y ajustes manuales detallando fecha, responsable, cantidad y justificación técnica.
5. **Descarga de Reportes**: Exportación a Excel/CSV de Ventas, Catálogo, Kardex e Utilidades con márgenes de rentabilidad.
6. **Auditoría Forense de Logs**: Consola de logs integrada para que los administradores vigilen el funcionamiento del sistema en vivo.

---

## 💻 Instalación y Arranque Rápido

### Requisitos
- Node.js (v18 o superior)
- Conexión a Internet

### Pasos de Arranque
1. Instala las dependencias unificadas en la raíz:
   ```bash
   npm install
   ```
2. Sincroniza y puebla tu base de datos Neon PostgreSQL (incluye el seeder con catálogo de ferretería, cuentas de prueba y transacciones de muestra):
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```
3. Enciende el sistema:
   ```bash
   npm start
   ```
   *¡Listo! Todo el sistema estará corriendo al instante en: **http://localhost:5000***

### Cuentas Demo de Prueba
- **Administrador (Acceso Completo + Reportes + Logs)**:
  - **Email**: `admin@freereterria.com`
  - **Contraseña**: `admin123`
- **Empleado de Caja (Acceso a POS, Almacén y Kardex)**:
  - **Email**: `empleado@freereterria.com`
  - **Contraseña**: `empleado123`

---

Desarrollado con ❤️ para **Freereterria**.
