const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/affectationController');

// GET all affectations (admin)
router.get('/', ctrl.getAffectations);

// GET today's affectations for a receveur
router.get('/receveur/:id/today', ctrl.getTodayAssignmentsForReceveur);

// POST create a new affectation
router.post('/', ctrl.createAffectation);

// DELETE an affectation
router.delete('/:id', ctrl.deleteAffectation);

module.exports = router;
