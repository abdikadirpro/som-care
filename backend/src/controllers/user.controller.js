const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { success, error, paginated } = require('../utils/response');

// Roles that ADMIN (non-super) is not allowed to see or manage
const PROTECTED_ROLES = ['SUPER_ADMIN', 'ADMIN'];

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // ADMIN can only see PHARMACIST and CASHIER; SUPER_ADMIN sees everyone
    if (req.user.role === 'ADMIN') {
      where.role = { notIn: PROTECTED_ROLES };
    }

    if (search) where.OR = [{ firstName: { contains: search } }, { lastName: { contains: search } }, { email: { contains: search } }];
    if (role) {
      const upperRole = role.toUpperCase();
      // Prevent ADMIN from filtering to protected roles
      if (req.user.role === 'ADMIN' && PROTECTED_ROLES.includes(upperRole)) {
        return paginated(res, [], 0, page, limit);
      }
      where.role = upperRole;
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: parseInt(limit), select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, isActive: true, lastLogin: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) }, select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, avatar: true, address: true, city: true, isActive: true, lastLogin: true, createdAt: true } });
    if (!user) return error(res, 'User not found', 404);
    return success(res, user);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role, city, address } = req.body;

    // ADMIN cannot create SUPER_ADMIN or ADMIN accounts
    if (req.user.role === 'ADMIN' && PROTECTED_ROLES.includes(role?.toUpperCase())) {
      return error(res, 'Insufficient permissions to create this role', 403);
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { firstName, lastName, email, password: hashed, phone, role, city, address }, select: { id: true, firstName: true, lastName: true, email: true, role: true } });
    return success(res, user, 'User created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    delete data.password;

    // Prevent ADMIN from assigning or modifying protected roles
    if (req.user.role === 'ADMIN' && data.role && PROTECTED_ROLES.includes(data.role.toUpperCase())) {
      return error(res, 'Insufficient permissions to assign this role', 403);
    }

    if (req.file) data.avatar = `/uploads/avatars/${req.file.filename}`;
    const user = await prisma.user.update({ where: { id: parseInt(req.params.id) }, data, select: { id: true, firstName: true, lastName: true, email: true, role: true, phone: true, avatar: true, isActive: true } });
    return success(res, user, 'User updated');
  } catch (err) { next(err); }
};

const toggleStatus = async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!target) return error(res, 'User not found', 404);

    // ADMIN cannot toggle SUPER_ADMIN or ADMIN accounts
    if (req.user.role === 'ADMIN' && PROTECTED_ROLES.includes(target.role)) {
      return error(res, 'Insufficient permissions', 403);
    }

    const updated = await prisma.user.update({ where: { id: target.id }, data: { isActive: !target.isActive } });
    return success(res, { isActive: updated.isActive }, `User ${updated.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!target) return error(res, 'User not found', 404);
    if (target.id === req.user.id) return error(res, 'Cannot delete your own account', 400);

    // Check for linked sales records (cashierId is the FK)
    const salesCount = await prisma.sale.count({ where: { cashierId: target.id } });
    if (salesCount > 0) return error(res, `Cannot delete — user has ${salesCount} sale record(s). Deactivate instead.`, 409);

    await prisma.user.delete({ where: { id: target.id } });
    return success(res, null, 'User deleted');
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, toggleStatus, deleteUser };
