const router = require('express').Router();
const ctrl   = require('../controllers/shop.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadPrescription } = require('../middleware/upload');

// Public
router.get('/medicines',  ctrl.getMedicines);
router.get('/categories', ctrl.getCategories);

// Customer auth required
router.post('/upload-prescription', authenticate, uploadPrescription.single('prescription'), ctrl.uploadPrescriptionImg);
router.post('/orders',              authenticate, ctrl.createOrder);
router.get('/orders/mine',          authenticate, ctrl.getMyOrders);
router.get('/orders/:id',           authenticate, ctrl.getOrderDetail);

// Staff auth required
router.get('/admin/orders',               authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'), ctrl.getAdminOrders);
router.patch('/admin/orders/:id/status',  authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'), ctrl.updateOrderStatus);

module.exports = router;
