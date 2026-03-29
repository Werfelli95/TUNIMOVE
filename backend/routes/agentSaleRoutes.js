const express = require('express');
const router = express.Router();
const agentSaleController = require('../controllers/agentSaleController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/lines/active', authMiddleware, agentSaleController.getActiveLines);
router.get('/services/today', authMiddleware, agentSaleController.getTodayServices);
router.get('/lignes/:num_ligne/stations', authMiddleware, agentSaleController.getLineStops);
router.get('/services/:id_service/occupied-seats', authMiddleware, agentSaleController.getOccupiedSeats);
router.post('/tarif/calculate', authMiddleware, agentSaleController.calculateFare);

router.post('/tickets', authMiddleware, agentSaleController.createTicket);
router.post('/tickets/:id/print', authMiddleware, agentSaleController.printTicketOnce);
router.post('/reservations', authMiddleware, agentSaleController.createReservation);
router.get('/tickets/me', authMiddleware, agentSaleController.getMySales);
router.get('/reservations/me', authMiddleware, agentSaleController.getMyReservations);

module.exports = router;