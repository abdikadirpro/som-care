const router = require('express').Router();
const ctrl = require('../controllers/expense.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.post('/', authenticate, ctrl.create);
router.put('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), ctrl.remove);

module.exports = router;
