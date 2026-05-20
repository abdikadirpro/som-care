const prisma = require('../config/database');
const { success, paginated } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (category) where.category = { contains: category };
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59); where.expenseDate.lte = e; }
    }

    const [data, total] = await Promise.all([
      prisma.expense.findMany({ where, skip, take: parseInt(limit), include: { creator: { select: { firstName: true, lastName: true } } }, orderBy: { expenseDate: 'desc' } }),
      prisma.expense.count({ where }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { title, amount, category, note, expenseDate } = req.body;
    const expense = await prisma.expense.create({
      data: { title, amount: parseFloat(amount), category, note, expenseDate: new Date(expenseDate), createdBy: req.user.id },
    });
    return success(res, expense, 'Expense created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.amount) data.amount = parseFloat(data.amount);
    if (data.expenseDate) data.expenseDate = new Date(data.expenseDate);
    const expense = await prisma.expense.update({ where: { id: parseInt(req.params.id) }, data });
    return success(res, expense, 'Expense updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await prisma.expense.delete({ where: { id: parseInt(req.params.id) } });
    return success(res, null, 'Expense deleted');
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove };
