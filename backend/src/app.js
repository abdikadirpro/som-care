const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use('/api', limiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/users',         require('./routes/user.routes'));
app.use('/api/categories',    require('./routes/category.routes'));
app.use('/api/medicines',     require('./routes/medicine.routes'));
app.use('/api/sales',         require('./routes/sale.routes'));
app.use('/api/suppliers',     require('./routes/supplier.routes'));
app.use('/api/customers',     require('./routes/customer.routes'));
app.use('/api/prescriptions', require('./routes/prescription.routes'));
app.use('/api/expenses',      require('./routes/expense.routes'));
app.use('/api/analytics',     require('./routes/analytics.routes'));
app.use('/api/inventory',     require('./routes/inventory.routes'));
app.use('/api/shop',          require('./routes/shop.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use(errorHandler);

module.exports = app;
