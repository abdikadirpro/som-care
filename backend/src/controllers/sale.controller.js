const prisma = require('../config/database');
const { success, error, paginated } = require('../utils/response');
const { generateInvoiceNo } = require('../utils/invoiceGenerator');
const { toPieces } = require('../utils/unitCalculator');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, paymentMethod, startDate, endDate, cashierId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) where.OR = [{ invoiceNo: { contains: search } }, { customer: { phone: { contains: search } } }];
    if (status) where.status = status.toUpperCase();
    if (paymentMethod) where.paymentMethod = paymentMethod.toUpperCase();
    if (cashierId) where.cashierId = parseInt(cashierId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59); where.createdAt.lte = end; }
    }

    const [data, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          cashier: { select: { id: true, firstName: true, lastName: true } },
          items: { include: { medicine: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        cashier: { select: { id: true, firstName: true, lastName: true } },
        items: { include: { medicine: { select: { id: true, name: true, barcode: true, form: true } } } },
      },
    });
    if (!sale) return error(res, 'Sale not found', 404);
    return success(res, sale);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { customerId, items, paymentMethod = 'CASH', paidAmount, discountAmount = 0, notes } = req.body;

    if (!items || items.length === 0) return error(res, 'Cart items required', 400);

    const medicineIds = items.map(i => i.medicineId);
    const medicines = await prisma.medicine.findMany({ where: { id: { in: medicineIds } } });
    const medMap = Object.fromEntries(medicines.map(m => [m.id, m]));

    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const med = medMap[item.medicineId];
      if (!med) return error(res, `Medicine ${item.medicineId} not found`, 404);

      const piecesNeeded = toPieces(parseFloat(item.quantity), item.sellingUnit || 'PIECE', med);

      if (med.stockQuantity < piecesNeeded) {
        return error(res, `Insufficient stock for ${med.name}. Available: ${med.stockQuantity} pieces`, 400);
      }

      const sellingPrice = parseFloat(item.sellingPrice || med.retailPrice);
      const purchasePrice = parseFloat(med.purchasePrice);
      const qty = parseFloat(item.quantity);
      const totalPrice = sellingPrice * qty;
      const totalCost = purchasePrice * piecesNeeded;
      const profit = totalPrice > totalCost ? totalPrice - totalCost : 0;
      const loss = totalCost > totalPrice ? totalCost - totalPrice : 0;

      subtotal += totalPrice;
      processedItems.push({
        medicineId: med.id,
        quantity: qty,
        sellingUnit: item.sellingUnit || 'PIECE',
        purchasePrice,
        sellingPrice,
        totalCost,
        totalPrice,
        profit,
        loss,
        _piecesNeeded: piecesNeeded,
      });
    }

    const taxPercent = parseFloat((await prisma.setting.findUnique({ where: { settingKey: 'tax_percent' } }))?.settingValue || '0');
    const taxAmount = (subtotal - parseFloat(discountAmount)) * (taxPercent / 100);
    const totalAmount = subtotal - parseFloat(discountAmount) + taxAmount;
    const paid = parseFloat(paidAmount);
    const changeAmount = paid - totalAmount;
    const paymentStatus = paid >= totalAmount ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING';

    const invoiceNo = generateInvoiceNo('POS');

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          invoiceNo,
          customerId: customerId ? parseInt(customerId) : null,
          cashierId: req.user.id,
          subtotal,
          discountAmount: parseFloat(discountAmount),
          taxAmount,
          totalAmount,
          paidAmount: paid,
          changeAmount: Math.max(0, changeAmount),
          paymentMethod: paymentMethod.toUpperCase(),
          paymentStatus,
          notes,
          items: {
            create: processedItems.map(({ _piecesNeeded, ...item }) => item),
          },
        },
        include: {
          items: { include: { medicine: { select: { id: true, name: true } } } },
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          cashier: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      for (const item of processedItems) {
        const med = medMap[item.medicineId];
        const newStock = med.stockQuantity - item._piecesNeeded;
        await tx.medicine.update({ where: { id: med.id }, data: { stockQuantity: newStock } });
        await tx.inventoryMovement.create({
          data: {
            medicineId: med.id,
            movementType: 'SALE',
            quantity: item._piecesNeeded,
            previousStock: med.stockQuantity,
            newStock,
            note: `Sale: ${invoiceNo}`,
            createdBy: req.user.id,
          },
        });
        med.stockQuantity = newStock;
      }

      if (customerId) {
        const pts = Math.floor(totalAmount / 100);
        if (pts > 0) await tx.customer.update({ where: { id: parseInt(customerId) }, data: { loyaltyPoints: { increment: pts } } });
      }

      return newSale;
    });

    return success(res, sale, 'Sale created', 201);
  } catch (err) { next(err); }
};

const returnSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findUnique({ where: { id: parseInt(id) }, include: { items: true } });
    if (!sale) return error(res, 'Sale not found', 404);
    if (sale.status === 'RETURNED') return error(res, 'Sale already returned', 400);

    await prisma.$transaction(async (tx) => {
      await tx.sale.update({ where: { id: sale.id }, data: { status: 'RETURNED' } });
      for (const item of sale.items) {
        const med = await tx.medicine.findUnique({ where: { id: item.medicineId } });
        const pcs = toPieces(parseFloat(item.quantity), item.sellingUnit, med);
        const newStock = med.stockQuantity + pcs;
        await tx.medicine.update({ where: { id: med.id }, data: { stockQuantity: newStock } });
        await tx.inventoryMovement.create({
          data: { medicineId: med.id, movementType: 'RETURN', quantity: pcs, previousStock: med.stockQuantity, newStock, note: `Return: ${sale.invoiceNo}`, createdBy: req.user.id },
        });
      }
    });

    return success(res, null, 'Sale returned successfully');
  } catch (err) { next(err); }
};

const todaySummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
        include: { items: true },
      }),
      prisma.expense.findMany({ where: { expenseDate: { gte: today, lt: tomorrow } } }),
    ]);

    const totalRevenue = sales.reduce((s, sale) => s + parseFloat(sale.totalAmount), 0);
    const totalProfit = sales.flatMap(s => s.items).reduce((s, i) => s + parseFloat(i.profit), 0);
    const totalLoss = sales.flatMap(s => s.items).reduce((s, i) => s + parseFloat(i.loss), 0);
    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const netIncome = totalRevenue - totalExpenses;

    return success(res, { totalRevenue, totalProfit, totalLoss, totalExpenses, netIncome, salesCount: sales.length });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, returnSale, todaySummary };
