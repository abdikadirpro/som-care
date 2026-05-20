const prisma = require('../config/database');
const { success, error } = require('../utils/response');
const { uniqueSlug } = require('../utils/slugify');

const getAll = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { medicines: true } } },
      orderBy: { name: 'asc' },
    });
    return success(res, categories);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, icon, description } = req.body;
    const slug = await uniqueSlug(prisma, 'category', name);
    const category = await prisma.category.create({ data: { name, slug, icon, description } });
    return success(res, category, 'Category created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon, description } = req.body;
    const data = { icon, description };
    if (name) { data.name = name; data.slug = await uniqueSlug(prisma, 'category', name, parseInt(id)); }
    const category = await prisma.category.update({ where: { id: parseInt(id) }, data });
    return success(res, category, 'Category updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const medicineCount = await prisma.medicine.count({ where: { categoryId: id } });
    if (medicineCount > 0) {
      return error(res, `Cannot delete: ${medicineCount} medicine(s) belong to this category. Reassign them first.`, 409);
    }
    await prisma.category.delete({ where: { id } });
    return success(res, null, 'Category deleted');
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove };
