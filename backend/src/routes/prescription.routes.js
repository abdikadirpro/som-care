const router = require('express').Router();
const ctrl = require('../controllers/prescription.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadPrescription } = require('../middleware/upload');

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', authenticate, uploadPrescription.single('prescription'), ctrl.create);
router.patch('/:id/review', authenticate, authorize('SUPER_ADMIN','ADMIN','PHARMACIST'), ctrl.review);

module.exports = router;
