const prisma = require('../config/database');
const { success, error, paginated } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = status ? { status: status.toUpperCase() } : {};

    const [data, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          reviewer: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.count({ where }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!prescription) return error(res, 'Prescription not found', 404);
    return success(res, prescription);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'Prescription image required', 400);
    const { customerId, notes } = req.body;
    const prescription = await prisma.prescription.create({
      data: { customerId: parseInt(customerId), imageUrl: `/uploads/prescriptions/${req.file.filename}`, notes },
    });
    return success(res, prescription, 'Prescription submitted', 201);
  } catch (err) { next(err); }
};

const review = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const prescription = await prisma.prescription.update({
      where: { id: parseInt(req.params.id) },
      data: { status: status.toUpperCase(), reviewedBy: req.user.id, reviewedAt: new Date(), notes },
    });
    return success(res, prescription, 'Prescription reviewed');
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, review };
