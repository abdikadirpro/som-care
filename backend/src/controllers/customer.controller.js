const prisma = require('../config/database');
const { success, error, paginated } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = search ? { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }, { phone: { contains: search } }, { email: { contains: search } }] } : {};

    const [data, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      prisma.customer.count({ where }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        sales: { orderBy: { createdAt: 'desc' }, take: 20, include: { items: { include: { medicine: { select: { name: true } } } } } },
        prescriptions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!customer) return error(res, 'Customer not found', 404);
    return success(res, customer);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    return success(res, customer, 'Customer created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const customer = await prisma.customer.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    return success(res, customer, 'Customer updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await prisma.customer.delete({ where: { id: parseInt(req.params.id) } });
    return success(res, null, 'Customer deleted');
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
