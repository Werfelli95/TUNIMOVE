const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

router.post('/', incidentController.createIncident);
router.get('/', incidentController.getAllIncidents);
router.patch('/:id/status', incidentController.updateIncidentStatus);

module.exports = router;
