const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');

// Route pour obtenir la liste des bus
router.get('/', busController.getBuses);
router.post('/', busController.createBus);
router.put('/:id', busController.updateBus);
router.delete('/:id', busController.deleteBus);
router.get('/active-count', busController.getActiveBusCount);

module.exports = router;
