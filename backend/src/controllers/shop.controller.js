const prisma = require('../config/database');
const { success, error, paginated } = require('../utils/response');
const { uploadToCloudinary, USE_CLOUDINARY } = require('../middleware/upload');

/* ── Public: list medicines ─────────────────────────────────────────────── */
const getMedicines = async (req, res, next) => {
  try {
    const { search, categoryId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true, stockQuantity: { gt: 0 } };
    if (search) where.OR = [
      { name: { contains: search } },
      { genericName: { contains: search } },
    ];
    if (categoryId) where.categoryId = parseInt(categoryId);

    const [data, total] = await Promise.all([
      prisma.medicine.findMany({
        where, skip, take: parseInt(limit),
        select: {
          id: true, name: true, genericName: true, form: true, strength: true,
          retailPrice: true, stockQuantity: true, imageUrl: true, featured: true,
          description: true, prescriptionRequired: true,
          category: { select: { id: true, name: true, icon: true } },
        },
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      }),
      prisma.medicine.count({ where }),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

/* ── Public: list categories ────────────────────────────────────────────── */
const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { medicines: { where: { isActive: true, stockQuantity: { gt: 0 } } } },
        },
      },
      orderBy: { name: 'asc' },
    });
    return success(res, categories);
  } catch (err) { next(err); }
};

/* ── Customer: upload prescription image ─────────────────────────────────── */
const uploadPrescriptionImg = async (req, res, next) => {
  try {
    if (req.user.role !== 'CUSTOMER') return error(res, 'Forbidden', 403);
    if (!req.file) return error(res, 'No file uploaded', 400);

    let url;
    if (USE_CLOUDINARY) {
      url = await uploadToCloudinary(req.file.buffer, 'prescriptions');
    } else {
      url = `/uploads/prescriptions/${req.file.filename}`;
    }
    return success(res, { url });
  } catch (err) { next(err); }
};

/* ── Customer: place order ───────────────────────────────────────────────── */
const createOrder = async (req, res, next) => {
  try {
    if (req.user.role !== 'CUSTOMER') return error(res, 'Forbidden', 403);

    const { items, paymentMethod = 'CASH', deliveryAddress, phone, paymentReference, notes, prescriptionUrl } = req.body;

    if (!items?.length) return error(res, 'No items in order', 400);
    if (!deliveryAddress?.trim()) return error(res, 'Delivery address is required', 400);

    const medicineIds = items.map(i => parseInt(i.medicineId));
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: medicineIds }, isActive: true },
    });

    // If any medicine requires prescription, validate one was provided
    const needsRx = medicines.some(m => m.prescriptionRequired);
    if (needsRx && !prescriptionUrl?.trim()) {
      return error(res, 'A prescription image is required for one or more items in your order', 400);
    }

    let subtotal = 0;
    const orderItems = items.map(item => {
      const med = medicines.find(m => m.id === parseInt(item.medicineId));
      if (!med) throw Object.assign(new Error(`Medicine not found`), { status: 400 });
      if (med.stockQuantity < parseInt(item.quantity)) {
        throw Object.assign(new Error(`Insufficient stock for "${med.name}" (only ${med.stockQuantity} left)`), { status: 400 });
      }
      const qty      = parseInt(item.quantity);
      const price    = parseFloat(med.retailPrice);
      const lineTotal = price * qty;
      subtotal += lineTotal;
      return {
        medicineId:    med.id,
        quantity:      qty,
        sellingUnit:   'PIECE',
        purchasePrice: parseFloat(med.purchasePrice || 0),
        sellingPrice:  price,
        totalCost:     parseFloat(med.purchasePrice || 0) * qty,
        totalPrice:    lineTotal,
        profit:        (price - parseFloat(med.purchasePrice || 0)) * qty,
        loss:          0,
      };
    });

    const invoiceNo = `ONL-${Date.now()}-${req.user.id}`;
    const orderNote = [
      '[ONLINE_ORDER]',
      `Address: ${deliveryAddress}`,
      phone             ? `Phone: ${phone}`                     : null,
      paymentReference  ? `Ref: ${paymentReference}`            : null,
      notes             ? `Note: ${notes}`                      : null,
    ].filter(Boolean).join(' | ');

    const sale = await prisma.sale.create({
      data: {
        invoiceNo,
        cashierId:      req.user.id,
        subtotal,
        totalAmount:    subtotal,
        paidAmount:     ['CASH', 'COD'].includes(paymentMethod) ? 0 : subtotal,
        paymentMethod:  paymentMethod === 'COD' ? 'CASH' : paymentMethod,
        paymentStatus:  ['CASH', 'COD'].includes(paymentMethod) ? 'PENDING' : 'PAID',
        status:         'COMPLETED',
        notes:          orderNote,
        prescriptionUrl: prescriptionUrl || null,
        onlineStatus:   'PENDING',
        items: { create: orderItems },
      },
      include: {
        items: { include: { medicine: { select: { name: true } } } },
      },
    });

    return success(res, sale, 'Order placed successfully', 201);
  } catch (err) {
    if (err.status === 400) return error(res, err.message, 400);
    next(err);
  }
};

/* ── Customer: my orders ─────────────────────────────────────────────────── */
const getMyOrders = async (req, res, next) => {
  try {
    if (req.user.role !== 'CUSTOMER') return error(res, 'Forbidden', 403);

    const orders = await prisma.sale.findMany({
      where: { cashierId: req.user.id, notes: { startsWith: '[ONLINE_ORDER]' } },
      include: {
        items: {
          include: { medicine: { select: { name: true, form: true, imageUrl: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return success(res, orders);
  } catch (err) { next(err); }
};

/* ── Customer: single order detail ──────────────────────────────────────── */
const getOrderDetail = async (req, res, next) => {
  try {
    if (req.user.role !== 'CUSTOMER') return error(res, 'Forbidden', 403);

    const order = await prisma.sale.findFirst({
      where: { id: parseInt(req.params.id), cashierId: req.user.id },
      include: { items: { include: { medicine: true } } },
    });
    if (!order) return error(res, 'Order not found', 404);

    return success(res, order);
  } catch (err) { next(err); }
};

/* ── Staff: list all online orders ──────────────────────────────────────── */
const getAdminOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { notes: { startsWith: '[ONLINE_ORDER]' } };
    if (status && status !== 'ALL') where.onlineStatus = status;

    const [data, total] = await Promise.all([
      prisma.sale.findMany({
        where, skip, take: parseInt(limit),
        include: {
          items: {
            include: { medicine: { select: { id: true, name: true, form: true, imageUrl: true } } },
          },
          cashier: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

/* ── Staff: update online order status ──────────────────────────────────── */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const VALID = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!VALID.includes(status)) return error(res, 'Invalid status', 400);

    const sale = await prisma.sale.findFirst({
      where: { id: parseInt(req.params.id), notes: { startsWith: '[ONLINE_ORDER]' } },
    });
    if (!sale) return error(res, 'Order not found', 404);

    const updated = await prisma.sale.update({
      where: { id: sale.id },
      data: { onlineStatus: status },
    });
    return success(res, updated, 'Order status updated');
  } catch (err) { next(err); }
};

module.exports = {
  getMedicines, getCategories,
  uploadPrescriptionImg, createOrder, getMyOrders, getOrderDetail,
  getAdminOrders, updateOrderStatus,
};
