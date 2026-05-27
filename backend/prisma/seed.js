const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el sembrado de la base de datos (seeding)...');

  // 1. Limpiar datos existentes para evitar duplicados
  await prisma.inventoryMovement.deleteMany({});
  await prisma.saleDetail.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.purchaseDetail.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Base de datos limpiada con éxito.');

  // 2. Crear Usuarios
  const adminPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('empleado123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador Freereterria',
      email: 'admin@freereterria.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const employee = await prisma.user.create({
    data: {
      name: 'Juan Pérez Empleado',
      email: 'empleado@freereterria.com',
      password: employeePassword,
      role: 'EMPLOYEE',
    },
  });

  console.log('Usuarios creados:');
  console.log(`- Administrador: ${admin.email}`);
  console.log(`- Empleado: ${employee.email}`);

  // 3. Crear Categorías
  const categoriesData = [
    { name: 'Herramientas Manuales', description: 'Destornilladores, martillos, llaves, alicates y herramientas de mano.' },
    { name: 'Herramientas Eléctricas', description: 'Taladros, amoladoras, sierras, lijadoras y maquinaria eléctrica.' },
    { name: 'Pinturas y Accesorios', description: 'Pinturas para interiores/exteriores, rodillos, brochas, disolventes y cintas.' },
    { name: 'Electricidad y Focos', description: 'Cables, interruptores, tomacorrientes, focos LED, canaletas y cintas aislantes.' },
    { name: 'Plomería y Conexiones', description: 'Tubos de PVC, conexiones, llaves de paso, teflón y adhesivos.' },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.create({ data: cat });
    categories.push(createdCat);
  }
  console.log(`Creadas ${categories.length} categorías.`);

  // 4. Crear Proveedores
  const suppliersData = [
    {
      name: 'Distribuidora Ferretera Express S.A.',
      phone: '+51 987654321',
      address: 'Av. Industrial 450, Ate, Lima',
      email: 'contacto@ferreteraexpress.com',
    },
    {
      name: 'Pinturas Continental S.A.C.',
      phone: '+51 912345678',
      address: 'Zona Industrial Norte Lote 12, Callao',
      email: 'ventas@continental.com',
    },
    {
      name: 'Corporación Eléctrica Universal',
      phone: '+51 933445566',
      address: 'Calle Los Focos 789, San Luis, Lima',
      email: 'pedidos@elecuniversal.com',
    },
  ];

  const suppliers = [];
  for (const sup of suppliersData) {
    const createdSup = await prisma.supplier.create({ data: sup });
    suppliers.push(createdSup);
  }
  console.log(`Creados ${suppliers.length} proveedores.`);

  // 5. Crear Productos
  const productsData = [
    {
      name: 'Martillo de Uña 16oz Mango de Fibra',
      sku: 'SKU-MART-001',
      brand: 'Truper',
      description: 'Martillo con mango de fibra de vidrio de alta resistencia con absorción de impactos y uña curva.',
      pricePurchase: 4.50,
      priceSale: 8.50,
      stock: 25,
      stockMin: 5,
      image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500&auto=format&fit=crop&q=60',
      categoryName: 'Herramientas Manuales',
    },
    {
      name: 'Juego de Destornilladores de Precisión 6 piezas',
      sku: 'SKU-DEST-002',
      brand: 'Stanley',
      description: 'Juego de destornilladores ideales para electrónica y joyería, puntas magnéticas templadas.',
      pricePurchase: 6.20,
      priceSale: 12.90,
      stock: 15,
      stockMin: 4,
      image: 'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?w=500&auto=format&fit=crop&q=60',
      categoryName: 'Herramientas Manuales',
    },
    {
      name: 'Taladro Percutor 1/2" 750W Profesional',
      sku: 'SKU-TALA-001',
      brand: 'DeWalt',
      description: 'Taladro percutor de velocidad variable y reversible. Empuñadura lateral de 360 grados.',
      pricePurchase: 35.00,
      priceSale: 59.90,
      stock: 10,
      stockMin: 3,
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60',
      categoryName: 'Herramientas Eléctricas',
    },
    {
      name: 'Amoladora Angular 4-1/2" 850W',
      sku: 'SKU-AMOL-001',
      brand: 'Bosch',
      description: 'Amoladora angular profesional, motor potente para corte y desbaste rápido de metales.',
      pricePurchase: 28.50,
      priceSale: 49.90,
      stock: 8,
      stockMin: 3,
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60',
      categoryName: 'Herramientas Eléctricas',
    },
    {
      name: 'Pintura Látex Super Lavable Blanca 1 Galón',
      sku: 'SKU-PINT-001',
      brand: 'Anypsa',
      description: 'Pintura látex acrílica de excelente poder cubriente y alta lavabilidad para interiores.',
      pricePurchase: 12.00,
      priceSale: 22.50,
      stock: 18,
      stockMin: 6,
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500&auto=format&fit=crop&q=60',
      categoryName: 'Pinturas y Accesorios',
    },
    {
      name: 'Brocha de Pintar Profesional 3"',
      sku: 'SKU-BROC-002',
      brand: 'Truper',
      description: 'Brocha con cerdas sintéticas de alta retención de pintura para acabados uniformes y suaves.',
      pricePurchase: 1.10,
      priceSale: 2.50,
      stock: 50,
      stockMin: 10,
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500&auto=format&fit=crop&q=60',
      categoryName: 'Pinturas y Accesorios',
    },
    {
      name: 'Foco LED E27 12W Luz Fría (6500K)',
      sku: 'SKU-FOCO-001',
      brand: 'Philips',
      description: 'Bombilla LED de bajo consumo energético, equivalente a 100W incandescente, larga vida útil.',
      pricePurchase: 0.80,
      priceSale: 1.90,
      stock: 120,
      stockMin: 20,
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=60',
      categoryName: 'Electricidad y Focos',
    },
    {
      name: 'Tubo de PVC para Agua Fría Clase 10 - 1/2" x 3m',
      sku: 'SKU-TUBO-001',
      brand: 'Pavco',
      description: 'Tubo de PVC resistente a altas presiones, ideal para instalaciones sanitarias de agua domiciliaria.',
      pricePurchase: 1.20,
      priceSale: 2.80,
      stock: 4, // Stock bajo a propósito (< stockMin de 10) para disparar alertas
      stockMin: 10,
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
      categoryName: 'Plomería y Conexiones',
    },
    {
      name: 'Cinta de Teflón Profesional 1/2" x 10m',
      sku: 'SKU-TEFL-002',
      brand: 'Pavco',
      description: 'Cinta selladora de teflón para roscas de tuberías plásticas y metálicas, evita filtraciones.',
      pricePurchase: 0.25,
      priceSale: 0.80,
      stock: 80,
      stockMin: 15,
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
      categoryName: 'Plomería y Conexiones',
    },
  ];

  const products = [];
  for (const prod of productsData) {
    const category = categories.find(c => c.name === prod.categoryName);
    const { categoryName, ...prodDetails } = prod;

    const createdProd = await prisma.product.create({
      data: {
        ...prodDetails,
        categoryId: category.id,
      },
    });

    products.push(createdProd);

    // Registrar un movimiento inicial de Kardex para cada producto
    await prisma.inventoryMovement.create({
      data: {
        productId: createdProd.id,
        type: 'INPUT',
        quantity: createdProd.stock,
        reason: 'INVENTARIO INICIAL SEMBRADO',
        userId: admin.id,
      },
    });
  }
  console.log(`Creados ${products.length} productos con sus respectivos movimientos de Kardex inicial.`);

  // 6. Crear una compra simulada
  console.log('Simulando una compra inicial a proveedores...');
  const purchase = await prisma.purchase.create({
    data: {
      supplierId: suppliers[0].id,
      userId: admin.id,
      total: 100.0,
      details: {
        create: [
          {
            productId: products[0].id, // Martillo
            quantity: 10,
            pricePurchase: products[0].pricePurchase,
          },
          {
            productId: products[1].id, // Destornillador
            quantity: 5,
            pricePurchase: products[1].pricePurchase,
          },
        ],
      },
    },
  });

  // Registrar movimientos en Kardex de la compra simulada
  await prisma.inventoryMovement.create({
    data: {
      productId: products[0].id,
      type: 'INPUT',
      quantity: 10,
      reason: `COMPRA # ${purchase.id}`,
      userId: admin.id,
    },
  });
  await prisma.inventoryMovement.create({
    data: {
      productId: products[1].id,
      type: 'INPUT',
      quantity: 5,
      reason: `COMPRA # ${purchase.id}`,
      userId: admin.id,
    },
  });
  console.log('Compra simulada completada exitosamente.');

  // 7. Crear una venta simulada
  console.log('Simulando una venta inicial POS...');
  const sale = await prisma.sale.create({
    data: {
      userId: employee.id,
      total: 19.80,
      discount: 1.0,
      saleDetails: {
        create: [
          {
            productId: products[0].id, // Martillo
            quantity: 2,
            priceSale: products[0].priceSale,
            total: products[0].priceSale * 2,
          },
          {
            productId: products[6].id, // Foco LED
            quantity: 2,
            priceSale: products[6].priceSale,
            total: products[6].priceSale * 2,
          },
        ],
      },
    },
  });

  // Registrar movimientos en Kardex de la venta simulada
  await prisma.inventoryMovement.create({
    data: {
      productId: products[0].id,
      type: 'OUTPUT',
      quantity: 2,
      reason: `VENTA POS # ${sale.id}`,
      userId: employee.id,
    },
  });
  await prisma.inventoryMovement.create({
    data: {
      productId: products[6].id,
      type: 'OUTPUT',
      quantity: 2,
      reason: `VENTA POS # ${sale.id}`,
      userId: employee.id,
    },
  });
  console.log('Venta simulada completada exitosamente.');

  console.log('Sembrado de la base de datos completado exitosamente (100% OK).');
}

main()
  .catch((e) => {
    console.error('Error en el sembrado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
