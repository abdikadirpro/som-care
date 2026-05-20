const prisma = require('../config/database');
const { success, paginated } = require('../utils/response');

const getMovements = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, medicineId, movementType, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (medicineId) where.medicineId = parseInt(medicineId);
    if (movementType) where.movementType = movementType.toUpperCase();
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59); where.createdAt.lte = e; }
    }

    const [data, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where, skip, take: parseInt(limit),
        include: { medicine: { select: { id: true, name: true } }, user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryMovement.count({ where }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

const getStockSummary = async (req, res, next) => {
  try {
    const [total, lowStock, outOfStock, expiringSoon, expired] = await Promise.all([
      prisma.medicine.count({ where: { isActive: true } }),
      prisma.medicine.count({ where: { isActive: true, stockQuantity: { gt: 0, lte: 10 } } }),
      prisma.medicine.count({ where: { isActive: true, stockQuantity: 0 } }),
      prisma.medicine.count({ where: { isActive: true, expiryDate: { lte: new Date(Date.now() + 30 * 86400000), gte: new Date() } } }),
      prisma.medicine.count({ where: { isActive: true, expiryDate: { lt: new Date() } } }),
    ]);

    const totalValue = await prisma.medicine.aggregate({ _sum: { stockQuantity: true }, where: { isActive: true } });

    return success(res, { total, lowStock, outOfStock, expiringSoon, expired, totalUnitsInStock: totalValue._sum.stockQuantity || 0 });
  } catch (err) { next(err); }
};

module.exports = { getMovements, getStockSummary };
