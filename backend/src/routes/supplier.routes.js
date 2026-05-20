const router = require('express').Router();
const ctrl = require('../controllers/supplier.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.get('/purchases', authenticate, ctrl.getPurchases);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), ctrl.create);
router.put('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), ctrl.update);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), ctrl.remove);
router.post('/purchases/create', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER','PHARMACIST'), ctrl.createPurchase);

module.exports = router;
