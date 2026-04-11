const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

// Route pour l'agent : demander une réinitialisation
router.post('/request', passwordResetController.requestReset);

// Routes pour l'admin : gérer les demandes
router.get('/stats', passwordResetController.getResetStats);
router.get('/pending', passwordResetController.getPendingRequests);
router.post('/approve/:id_demande', passwordResetController.approveReset);
router.delete('/:id', passwordResetController.deleteRequest);

module.exports = router;
