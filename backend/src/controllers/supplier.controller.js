const prisma = require('../config/database');
const { success, error, paginated } = require('../utils/response');
const { generateInvoiceNo } = require('../utils/invoiceGenerator');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = search ? { OR: [{ name: { contains: search } }, { phone: { contains: search } }, { email: { contains: search } }] } : {};

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take: parseInt(limit), orderBy: { name: 'asc' } }),
      prisma.supplier.count({ where }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { purchases: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!supplier) return error(res, 'Supplier not found', 404);
    return success(res, supplier);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.create({ data: req.body });
    return success(res, supplier, 'Supplier created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    return success(res, supplier, 'Supplier updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const [medicineCount, purchaseCount] = await Promise.all([
      prisma.medicine.count({ where: { supplierId: id } }),
      prisma.purchase.count({ where: { supplierId: id } }),
    ]);

    if (medicineCount > 0) {
      return error(res, `Cannot delete: ${medicineCount} medicine(s) are linked to this supplier. Reassign or remove those medicines first.`, 409);
    }
    if (purchaseCount > 0) {
      return error(res, `Cannot delete: this supplier has ${purchaseCount} purchase record(s). Archive instead.`, 409);
    }

    await prisma.supplier.delete({ where: { id } });
    return success(res, null, 'Supplier deleted');
  } catch (err) { next(err); }
};

const createPurchase = async (req, res, next) => {
  try {
    const { supplierId, items, paidAmount = 0 } = req.body;

    // FIX: extract medicineId from each item object and parse to Int
    const meds = await prisma.medicine.findMany({
      where: { id: { in: items.map(item => parseInt(item.medicineId)) } }
    });

    const medMap = Object.fromEntries(meds.map(m => [m.id, m]));

    let totalAmount = 0;
    const processedItems = items.map(item => {
      const total = parseFloat(item.purchasePrice) * parseInt(item.quantity);
      totalAmount += total;
      return {
        medicineId: parseInt(item.medicineId),
        quantity: parseInt(item.quantity),
        purchasePrice: parseFloat(item.purchasePrice),
        totalPrice: total,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
        batchNumber: item.batchNumber
      };
    });

    const paid = parseFloat(paidAmount);
    const dueAmount = totalAmount - paid;
    const status = paid >= totalAmount ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING';

    const purchase = await prisma.$transaction(async (tx) => {
      const p = await tx.purchase.create({
        data: {
          supplierId: parseInt(supplierId),
          invoiceNo: generateInvoiceNo('PUR'),
          totalAmount,
          paidAmount: paid,
          dueAmount,
          status,
          createdBy: req.user.id,
          items: { create: processedItems },
        },
        include: { items: true },
      });

      for (const item of processedItems) {
        const med = medMap[item.medicineId];
        const newStock = med.stockQuantity + item.quantity;
        await tx.medicine.update({
          where: { id: med.id },
          data: {
            stockQuantity: newStock,
            purchasePrice: item.purchasePrice,
            ...(item.expiryDate && { expiryDate: item.expiryDate }),
            ...(item.batchNumber && { batchNumber: item.batchNumber }),
          },
        });
        await tx.inventoryMovement.create({
          data: {
            medicineId: med.id,
            movementType: 'PURCHASE',
            quantity: item.quantity,
            previousStock: med.stockQuantity,
            newStock,
            note: `Purchase: ${p.invoiceNo}`,
            createdBy: req.user.id
          },
        });
        med.stockQuantity = newStock;
      }

      if (dueAmount > 0) {
        await tx.supplier.update({
          where: { id: parseInt(supplierId) },
          data: { balanceDue: { increment: dueAmount } }
        });
      }

      return p;
    });

    return success(res, purchase, 'Purchase created', 201);
  } catch (err) { next(err); }
};

const getPurchases = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, supplierId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = supplierId ? { supplierId: parseInt(supplierId) } : {};

    const [data, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          supplier: { select: { id: true, name: true } },
          items: { include: { medicine: { select: { id: true, name: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.purchase.count({ where }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, createPurchase, getPurchases };