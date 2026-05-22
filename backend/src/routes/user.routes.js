const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.get('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), ctrl.getAll);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), ctrl.create);
router.put('/:id', authenticate, uploadAvatar.single('avatar'), ctrl.update);
router.patch('/:id/toggle-status', authenticate, authorize('SUPER_ADMIN','ADMIN'), ctrl.toggleStatus);
router.delete('/:id',             authenticate, authorize('SUPER_ADMIN'),          ctrl.deleteUser);

module.exports = router;
