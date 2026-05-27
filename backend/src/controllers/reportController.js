const prisma = require('../db');
const logger = require('../logger');

// Obtener estadísticas consolidadas del Dashboard
async function getDashboardStats(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Total Productos Activos
    const totalProducts = await prisma.product.count({
      where: { status: 'ACTIVE' }
    });

    // 2. Cantidad de Productos con Bajo Stock
    // Cargamos los productos activos y filtramos en memoria
    const allProds = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { stock: true, stockMin: true }
    });
    const lowStockCount = allProds.filter(p => p.stock <= p.stockMin).length;

    // 3. Ventas del Día
    const salesTodayResult = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: today
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    });
    const salesToday = salesTodayResult._sum.total || 0;
    const salesCountToday = salesTodayResult._count.id || 0;

    // 4. Ganancias Mensuales (Ingresos del Mes)
    const salesMonthResult = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: firstDayOfMonth
        }
      },
      _sum: {
        total: true
      }
    });
    const earningsMonth = salesMonthResult._sum.total || 0;

    // 5. Gráfico: Tendencia de Ventas (Últimos 7 días)
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dEnd = new Date(d);
      dEnd.setDate(dEnd.getDate() + 1);

      const daySales = await prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: d,
            lt: dEnd
          }
        },
        _sum: {
          total: true
        }
      });

      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      salesTrend.push({
        name: dayName,
        ventas: daySales._sum.total || 0
      });
    }

    // 6. Gráfico: Distribución de Stock por Categoría
    const categories = await prisma.category.findMany({
      include: {
        products: {
          where: { status: 'ACTIVE' },
          select: { stock: true }
        }
      }
    });

    const categoryDist = categories.map(cat => {
      const stockTotal = cat.products.reduce((acc, curr) => acc + curr.stock, 0);
      return {
        name: cat.name,
        value: stockTotal
      };
    }).filter(item => item.value > 0);

    // 7. Productos con stock más bajo (Top 5) para mostrar alertas directas
    const lowStockAlerts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        category: { select: { name: true } }
      },
      orderBy: { stock: 'asc' },
      take: 8
    });
    const filteredLowStockAlerts = lowStockAlerts.filter(p => p.stock <= p.stockMin);

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
        salesToday,
        salesCountToday,
        earningsMonth,
        salesTrend,
        categoryDist,
        lowStockAlerts: filteredLowStockAlerts
      }
    });
  } catch (error) {
    next(error);
  }
}

// Obtener registros de logs del sistema (Solo administradores)
async function getSystemLogs(req, res, next) {
  try {
    const rawLogs = logger.getLogs();
    // Invertir para ver primero los más recientes
    const logs = rawLogs.reverse().slice(0, 200); // Top 200 logs

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  getSystemLogs
};
