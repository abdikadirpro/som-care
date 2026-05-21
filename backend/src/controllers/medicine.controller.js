const prisma = require('../config/database');
const { success, error, paginated } = require('../utils/response');
const { uniqueSlug } = require('../utils/slugify');
const { uploadToCloudinary, USE_CLOUDINARY } = require('../middleware/upload');

const resolveImageUrl = async (req) => {
  if (!req.file) return undefined;
  if (USE_CLOUDINARY) return await uploadToCloudinary(req.file.buffer, 'medicines');
  return `/uploads/medicines/${req.file.filename}`;
};

// Optional string fields — convert '' to null so unique constraints (barcode, sku) never collide on blank values
const OPTIONAL_STRINGS = [
  'barcode', 'sku', 'genericName', 'description', 'manufacturer',
  'dosage', 'strength', 'batchNumber', 'imageUrl',
];
const sanitize = (data) => {
  OPTIONAL_STRINGS.forEach(f => { if (data[f] === '') data[f] = null; });
  // supplierId '' → null (optional FK)
  if (data.supplierId === '' || data.supplierId === 0 || data.supplierId === '0') data.supplierId = null;
  return data;
};

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, categoryId, supplierId, lowStock, expiring, isActive, inStock, form } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) where.OR = [{ name: { contains: search } }, { genericName: { contains: search } }, { barcode: { contains: search } }, { sku: { contains: search } }];
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (supplierId) where.supplierId = parseInt(supplierId);
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (form) where.form = form.toUpperCase();
    if (inStock === 'true') where.stockQuantity = { gt: 0 };
    if (lowStock === 'true') where.stockQuantity = { lte: prisma.medicine.fields.minimumStock };
    if (expiring === 'true') {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      where.expiryDate = { lte: thirtyDays, gte: new Date() };
    }

    const [data, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { category: { select: { id: true, name: true } }, supplier: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.medicine.count({ where }),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const medicine = await prisma.medicine.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true, supplier: true },
    });
    if (!medicine) return error(res, 'Medicine not found', 404);
    return success(res, medicine);
  } catch (err) { next(err); }
};

const getByBarcode = async (req, res, next) => {
  try {
    const medicine = await prisma.medicine.findUnique({
      where: { barcode: req.params.barcode },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!medicine) return error(res, 'Medicine not found', 404);
    return success(res, medicine);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = sanitize(req.body);
    data.slug = await uniqueSlug(prisma, 'medicine', data.name);

    const imageUrl = await resolveImageUrl(req);
    if (imageUrl) data.imageUrl = imageUrl;

    const numericFields = ['categoryId', 'piecesPerStrip', 'stripsPerBox', 'boxesPerDozen', 'boxesPerCarton', 'stockQuantity', 'minimumStock'];
    numericFields.forEach(f => { if (data[f] !== undefined && data[f] !== null) data[f] = parseInt(data[f]); });
    if (data.supplierId !== null && data.supplierId !== undefined) data.supplierId = parseInt(data.supplierId);

    const decimalFields = ['purchasePrice', 'retailPrice', 'wholesalePrice', 'minimumPrice', 'taxPercent', 'discountPercent'];
    decimalFields.forEach(f => { if (data[f] !== undefined) data[f] = parseFloat(data[f]); });

    if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);
    if (data.prescriptionRequired !== undefined) data.prescriptionRequired = data.prescriptionRequired === 'true' || data.prescriptionRequired === true;
    if (data.featured !== undefined) data.featured = data.featured === 'true' || data.featured === true;
    if (data.isActive !== undefined) data.isActive = data.isActive === 'true' || data.isActive === true;

    const medicine = await prisma.medicine.create({
      data,
      include: { category: { select: { id: true, name: true } } },
    });

    if (medicine.stockQuantity > 0) {
      await prisma.inventoryMovement.create({
        data: {
          medicineId: medicine.id,
          movementType: 'PURCHASE',
          quantity: medicine.stockQuantity,
          previousStock: 0,
          newStock: medicine.stockQuantity,
          note: 'Initial stock',
          createdBy: req.user.id,
        },
      });
    }

    return success(res, medicine, 'Medicine created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = sanitize({ ...req.body });

    if (data.name) data.slug = await uniqueSlug(prisma, 'medicine', data.name, parseInt(id));
    const imageUrl = await resolveImageUrl(req);
    if (imageUrl) data.imageUrl = imageUrl;

    const numericFields = ['categoryId', 'piecesPerStrip', 'stripsPerBox', 'boxesPerDozen', 'boxesPerCarton', 'minimumStock'];
    numericFields.forEach(f => { if (data[f] !== undefined && data[f] !== null) data[f] = parseInt(data[f]); });
    if (data.supplierId !== null && data.supplierId !== undefined) data.supplierId = parseInt(data.supplierId);

    const decimalFields = ['purchasePrice', 'retailPrice', 'wholesalePrice', 'minimumPrice', 'taxPercent', 'discountPercent'];
    decimalFields.forEach(f => { if (data[f] !== undefined) data[f] = parseFloat(data[f]); });

    if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);
    if (data.prescriptionRequired !== undefined) data.prescriptionRequired = data.prescriptionRequired === 'true' || data.prescriptionRequired === true;
    if (data.featured !== undefined) data.featured = data.featured === 'true' || data.featured === true;
    if (data.isActive !== undefined) data.isActive = data.isActive === 'true' || data.isActive === true;

    const medicine = await prisma.medicine.update({
      where: { id: parseInt(id) },
      data,
      include: { category: { select: { id: true, name: true } } },
    });
    return success(res, medicine, 'Medicine updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const [saleCount, purchaseCount, movementCount] = await Promise.all([
      prisma.saleItem.count({ where: { medicineId: id } }),
      prisma.purchaseItem.count({ where: { medicineId: id } }),
      prisma.inventoryMovement.count({ where: { medicineId: id } }),
    ]);

    if (saleCount > 0 || purchaseCount > 0 || movementCount > 0) {
      // Has history — soft delete to preserve data integrity
      await prisma.medicine.update({ where: { id }, data: { isActive: false } });
      return success(res, null, 'Medicine deactivated (has sales/purchase history and cannot be permanently deleted)');
    }

    await prisma.medicine.delete({ where: { id } });
    return success(res, null, 'Medicine deleted');
  } catch (err) { next(err); }
};

const adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, movementType, note } = req.body;

    const medicine = await prisma.medicine.findUnique({ where: { id: parseInt(id) } });
    if (!medicine) return error(res, 'Medicine not found', 404);

    const qty = parseInt(quantity);
    const newStock =
      ['PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(movementType)
        ? medicine.stockQuantity + qty
        : medicine.stockQuantity - qty;

    if (newStock < 0) return error(res, 'Insufficient stock', 400);

    const [updated] = await prisma.$transaction([
      prisma.medicine.update({ where: { id: medicine.id }, data: { stockQuantity: newStock } }),
      prisma.inventoryMovement.create({
        data: {
          medicineId: medicine.id,
          movementType,
          quantity: qty,
          previousStock: medicine.stockQuantity,
          newStock,
          note,
          createdBy: req.user.id,
        },
      }),
    ]);

    return success(res, updated, 'Stock adjusted');
  } catch (err) { next(err); }
};

const getLowStock = async (req, res, next) => {
  try {
    const medicines = await prisma.medicine.findMany({
      where: { isActive: true, stockQuantity: { lte: 10 } },
      include: { category: { select: { name: true } } },
      orderBy: { stockQuantity: 'asc' },
    });
    return success(res, medicines);
  } catch (err) { next(err); }
};

const getExpiring = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30');
    const future = new Date();
    future.setDate(future.getDate() + days);

    const medicines = await prisma.medicine.findMany({
      where: { isActive: true, expiryDate: { lte: future, gte: new Date() } },
      include: { category: { select: { name: true } } },
      orderBy: { expiryDate: 'asc' },
    });
    return success(res, medicines);
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, getByBarcode, create, update, remove, adjustStock, getLowStock, getExpiring };
