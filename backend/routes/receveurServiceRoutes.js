const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/receveurServiceController');

router.post('/start', ctrl.startService);
router.post('/:id/close', ctrl.closeService);
router.post('/:id/avancer', ctrl.avancerStation);
router.get('/active/:numero_bus', ctrl.getActiveService);
router.get('/:id/tickets', ctrl.getServiceTickets);

module.exports = router;
