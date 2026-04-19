const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login/admin', authController.loginAdmin);
router.post('/login/agent', authController.loginAgent);
router.post('/login/receveur', authController.loginReceveur);
router.post('/login/controleur', authController.loginControleur);

module.exports = router;
