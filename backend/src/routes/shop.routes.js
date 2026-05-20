const router = require('express').Router();
const ctrl   = require('../controllers/shop.controller');
const { authenticate } = require('../middleware/auth');

// Public
router.get('/medicines',   ctrl.getMedicines);
router.get('/categories',  ctrl.getCategories);

// Customer auth required
router.post('/orders',           authenticate, ctrl.createOrder);
router.get('/orders/mine',       authenticate, ctrl.getMyOrders);
router.get('/orders/:id',        authenticate, ctrl.getOrderDetail);

module.exports = router;
