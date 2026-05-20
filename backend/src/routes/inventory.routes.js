const router = require('express').Router();
const ctrl = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth');

router.get('/movements', authenticate, ctrl.getMovements);
router.get('/summary', authenticate, ctrl.getStockSummary);

module.exports = router;
