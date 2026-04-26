const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

router.get('/', saleController.getSalesHistory);
router.post('/tickets/vendre', saleController.sellTicket);
router.get('/tickets/occupied-seats', saleController.getOccupiedSeats);
router.get('/stats/revenue', saleController.getRevenueStats);
router.get('/stats/passengers', saleController.getPassengerStats);
router.get('/agent/:agentId/daily', saleController.getAgentDailySales);
router.get('/controleur/:controleurId/daily', saleController.getControleurDailyScans);
router.get('/stats/bus-occupancy', saleController.getBusOccupancy);
router.get('/stats/advanced', saleController.getAdvancedStats);
router.post('/tickets/scan', saleController.scanTicket);
router.get('/bus/:numero_bus/manifeste', saleController.getManifeste);

module.exports = router;
