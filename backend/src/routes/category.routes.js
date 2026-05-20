const router = require('express').Router();
const ctrl = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), ctrl.create);
router.put('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), ctrl.update);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), ctrl.remove);

module.exports = router;
