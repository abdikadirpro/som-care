const router = require('express').Router();
const ctrl = require('../controllers/sale.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.get('/today-summary', authenticate, ctrl.todaySummary);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER','PHARMACIST','CASHIER'), ctrl.create);
router.post('/:id/return', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), ctrl.returnSale);

module.exports = router;
