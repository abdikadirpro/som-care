const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role = 'CUSTOMER', city, address } = req.body;

    if (!firstName || !lastName || !password) {
      return error(res, 'First name, last name and password are required', 400);
    }

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return error(res, 'Email already registered', 409);
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { firstName, lastName, email, password: hashed, phone, role, city, address },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, phone: true, createdAt: true },
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return success(res, { user, accessToken }, 'Registration successful', 201);
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password required', 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return error(res, 'Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return error(res, 'Invalid credentials', 401);

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const accessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

    const { password: _, ...userData } = user;
    return success(res, { user: userData, accessToken }, 'Login successful');
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return error(res, 'Refresh token required', 401);

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) return error(res, 'User not found', 401);

    const accessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email });
    return success(res, { accessToken }, 'Token refreshed');
  } catch { return error(res, 'Invalid refresh token', 401); }
};

const logout = (req, res) => {
  res.clearCookie('refreshToken');
  return success(res, null, 'Logged out');
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, avatar: true, city: true, address: true, lastLogin: true, createdAt: true },
    });
    if (!user) return error(res, 'User not found', 404);
    return success(res, user);
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return error(res, 'Current password is incorrect', 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    return success(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};

module.exports = { register, login, refresh, logout, getMe, changePassword };
