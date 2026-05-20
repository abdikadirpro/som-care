const router = require('express').Router();
const ctrl = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');

router.get('/dashboard', authenticate, ctrl.getDashboardStats);
router.get('/my-stats', authenticate, ctrl.getMyStats);
router.get('/hourly', authenticate, ctrl.getHourlySales);
router.get('/daily', authenticate, ctrl.getDailySales);
router.get('/monthly', authenticate, ctrl.getMonthlySales);
router.get('/top-medicines', authenticate, ctrl.getTopMedicines);
router.get('/profit-loss', authenticate, ctrl.getProfitLoss);

module.exports = router;
