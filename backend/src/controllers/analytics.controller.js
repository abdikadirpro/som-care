const prisma = require('../config/database');
const { success } = require('../utils/response');

const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const [
      todaySales, monthSales, yearSales,
      totalMedicines, lowStockCount, expiredCount,
      totalCustomers, totalSuppliers,
      pendingPrescriptions, todayExpenses,
    ] = await Promise.all([
      prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true, where: { createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' } }),
      prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true, where: { createdAt: { gte: monthStart }, status: 'COMPLETED' } }),
      prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true, where: { createdAt: { gte: yearStart }, status: 'COMPLETED' } }),
      prisma.medicine.count({ where: { isActive: true } }),
      prisma.medicine.count({ where: { isActive: true, stockQuantity: { lte: 10 } } }),
      prisma.medicine.count({ where: { isActive: true, expiryDate: { lte: new Date() } } }),
      prisma.customer.count(),
      prisma.supplier.count(),
      prisma.prescription.count({ where: { status: 'PENDING' } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { expenseDate: { gte: today, lt: tomorrow } } }),
    ]);

    const todayItemsProfit = await prisma.saleItem.aggregate({
      _sum: { profit: true, loss: true },
      where: { sale: { createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' } },
    });

    return success(res, {
      today: {
        revenue: parseFloat(todaySales._sum.totalAmount || 0),
        salesCount: todaySales._count,
        profit: parseFloat(todayItemsProfit._sum.profit || 0),
        loss: parseFloat(todayItemsProfit._sum.loss || 0),
        expenses: parseFloat(todayExpenses._sum.amount || 0),
      },
      month: { revenue: parseFloat(monthSales._sum.totalAmount || 0), salesCount: monthSales._count },
      year: { revenue: parseFloat(yearSales._sum.totalAmount || 0), salesCount: yearSales._count },
      inventory: { total: totalMedicines, lowStock: lowStockCount, expired: expiredCount },
      customers: totalCustomers,
      suppliers: totalSuppliers,
      pendingPrescriptions,
    });
  } catch (err) { next(err); }
};

const getHourlySales = async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: date, lte: endOfDay }, status: 'COMPLETED' },
      select: { totalAmount: true, createdAt: true, items: { select: { profit: true } } },
    });

    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, label: `${h}:00`, revenue: 0, profit: 0, count: 0 }));
    sales.forEach(sale => {
      const h = new Date(sale.createdAt).getHours();
      hourly[h].revenue += parseFloat(sale.totalAmount);
      hourly[h].profit += sale.items.reduce((s, i) => s + parseFloat(i.profit), 0);
      hourly[h].count++;
    });

    return success(res, hourly);
  } catch (err) { next(err); }
};

const getDailySales = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30');
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - i);
      const next = new Date(day); next.setDate(next.getDate() + 1);

      const [agg, exp, profit] = await Promise.all([
        prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true, where: { createdAt: { gte: day, lt: next }, status: 'COMPLETED' } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { expenseDate: { gte: day, lt: next } } }),
        prisma.saleItem.aggregate({ _sum: { profit: true, loss: true }, where: { sale: { createdAt: { gte: day, lt: next }, status: 'COMPLETED' } } }),
      ]);

      result.push({
        date: day.toISOString().slice(0, 10),
        revenue: parseFloat(agg._sum.totalAmount || 0),
        salesCount: agg._count,
        expenses: parseFloat(exp._sum.amount || 0),
        profit: parseFloat(profit._sum.profit || 0),
        loss: parseFloat(profit._sum.loss || 0),
      });
    }

    return success(res, result);
  } catch (err) { next(err); }
};

const getMonthlySales = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());
    const result = [];

    for (let month = 0; month < 12; month++) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);

      const [agg, exp] = await Promise.all([
        prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true, where: { createdAt: { gte: start, lt: end }, status: 'COMPLETED' } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { expenseDate: { gte: start, lt: end } } }),
      ]);

      result.push({
        month: month + 1,
        label: start.toLocaleString('default', { month: 'short' }),
        revenue: parseFloat(agg._sum.totalAmount || 0),
        salesCount: agg._count,
        expenses: parseFloat(exp._sum.amount || 0),
      });
    }

    return success(res, result);
  } catch (err) { next(err); }
};

const getTopMedicines = async (req, res, next) => {
  try {
    const { limit = 10, period = '30' } = req.query;
    const since = new Date(); since.setDate(since.getDate() - parseInt(period));

    const topItems = await prisma.saleItem.groupBy({
      by: ['medicineId'],
      _sum: { quantity: true, totalPrice: true, profit: true },
      _count: { id: true },
      where: { sale: { createdAt: { gte: since }, status: 'COMPLETED' } },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: parseInt(limit),
    });

    const medicineIds = topItems.map(i => i.medicineId);
    const medicines = await prisma.medicine.findMany({ where: { id: { in: medicineIds } }, select: { id: true, name: true, imageUrl: true, retailPrice: true } });
    const medMap = Object.fromEntries(medicines.map(m => [m.id, m]));

    const data = topItems.map(item => ({
      medicine: medMap[item.medicineId],
      totalQuantity: parseFloat(item._sum.quantity || 0),
      totalRevenue: parseFloat(item._sum.totalPrice || 0),
      totalProfit: parseFloat(item._sum.profit || 0),
      salesCount: item._count.id,
    }));

    return success(res, data);
  } catch (err) { next(err); }
};

const getProfitLoss = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { status: 'COMPLETED' };
    if (startDate) { where.createdAt = { ...(where.createdAt || {}), gte: new Date(startDate) }; }
    if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59); where.createdAt = { ...(where.createdAt || {}), lte: e }; }

    const [saleAgg, itemAgg, expenses] = await Promise.all([
      prisma.sale.aggregate({ _sum: { totalAmount: true, discountAmount: true, taxAmount: true }, _count: true, where }),
      prisma.saleItem.aggregate({ _sum: { profit: true, loss: true, totalCost: true, totalPrice: true }, where: { sale: where } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: startDate || endDate ? { expenseDate: where.createdAt } : {} }),
    ]);

    const grossProfit = parseFloat(itemAgg._sum.profit || 0);
    const totalLoss = parseFloat(itemAgg._sum.loss || 0);
    const totalExpenses = parseFloat(expenses._sum.amount || 0);
    const netIncome = grossProfit - totalLoss - totalExpenses;

    return success(res, {
      totalRevenue: parseFloat(saleAgg._sum.totalAmount || 0),
      totalDiscount: parseFloat(saleAgg._sum.discountAmount || 0),
      totalTax: parseFloat(saleAgg._sum.taxAmount || 0),
      totalCost: parseFloat(itemAgg._sum.totalCost || 0),
      grossProfit,
      totalLoss,
      totalExpenses,
      netIncome,
      salesCount: saleAgg._count,
    });
  } catch (err) { next(err); }
};

// Personal stats for the logged-in pharmacist/cashier
const getMyStats = async (req, res, next) => {
  try {
    const cashierId = req.user.id;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const myWhere = { cashierId, status: 'COMPLETED' };

    const [todaySales, monthSales, totalSales, todayItems, recentSales] = await Promise.all([
      prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true, where: { ...myWhere, createdAt: { gte: today, lt: tomorrow } } }),
      prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true, where: { ...myWhere, createdAt: { gte: monthStart } } }),
      prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true, where: myWhere }),
      prisma.saleItem.aggregate({
        _sum: { profit: true, loss: true },
        where: { sale: { cashierId, status: 'COMPLETED', createdAt: { gte: today, lt: tomorrow } } },
      }),
      prisma.sale.findMany({
        where: myWhere,
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, invoiceNo: true, totalAmount: true, paymentMethod: true,
          createdAt: true,
          items: { select: { quantity: true, medicine: { select: { name: true } } } },
        },
      }),
    ]);

    // 7-day daily trend for this cashier
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const n = new Date(d); n.setDate(n.getDate() + 1);
      const agg = await prisma.sale.aggregate({
        _sum: { totalAmount: true }, _count: true,
        where: { cashierId, status: 'COMPLETED', createdAt: { gte: d, lt: n } },
      });
      trend.push({ date: d.toISOString().slice(0, 10), revenue: parseFloat(agg._sum.totalAmount || 0), count: agg._count });
    }

    return success(res, {
      today: {
        revenue: parseFloat(todaySales._sum.totalAmount || 0),
        salesCount: todaySales._count,
        profit: parseFloat(todayItems._sum.profit || 0),
        loss: parseFloat(todayItems._sum.loss || 0),
      },
      month: { revenue: parseFloat(monthSales._sum.totalAmount || 0), salesCount: monthSales._count },
      total: { revenue: parseFloat(totalSales._sum.totalAmount || 0), salesCount: totalSales._count },
      recentSales,
      trend,
    });
  } catch (err) { next(err); }
};

module.exports = { getDashboardStats, getHourlySales, getDailySales, getMonthlySales, getTopMedicines, getProfitLoss, getMyStats };
