const router = require('express').Router();
const ctrl = require('../controllers/medicine.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadMedicineImage } = require('../middleware/upload');

router.get('/', authenticate, ctrl.getAll);
router.get('/low-stock', authenticate, ctrl.getLowStock);
router.get('/expiring', authenticate, ctrl.getExpiring);
router.get('/barcode/:barcode', authenticate, ctrl.getByBarcode);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), uploadMedicineImage.single('image'), ctrl.create);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), uploadMedicineImage.single('image'), ctrl.update);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), ctrl.remove);
router.post('/:id/adjust-stock', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'), ctrl.adjustStock);

module.exports = router;
