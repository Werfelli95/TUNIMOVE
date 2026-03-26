const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');

// Route pour les 3 cartes de stats
router.get('/stats', assignmentController.getAssignmentStats);

// Route pour la liste du tableau (Bus + Receveurs)
router.get('/', assignmentController.getAssignments);

// Route pour la liste des receveurs libres (pour le choix dans le modal)
router.get('/available-receivers', assignmentController.getAvailableReceivers);

// Route pour enregistrer une nouvelle affectation
router.post('/update', assignmentController.updateAssignment);

module.exports = router;
