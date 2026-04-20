const express = require('express');
const router = express.Router();
const tarificationController = require('../controllers/tarificationController');

router.get('/', tarificationController.getTarifications);
router.get('/bagages', tarificationController.getBagages);

router.post('/', tarificationController.addTarification);
router.post('/bagages', tarificationController.addBagage);

router.put('/:id/toggle', tarificationController.toggleTarification);
router.put('/bagages/:id/toggle', tarificationController.toggleBagage);

module.exports = router;
