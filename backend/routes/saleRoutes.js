const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

router.get('/', saleController.getSalesHistory);
router.post('/tickets/vendre', saleController.sellTicket);
router.get('/tickets/occupied-seats', saleController.getOccupiedSeats);

module.exports = router;
