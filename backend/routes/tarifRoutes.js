const express = require('express');
const router = express.Router();
const tarifController = require('../controllers/tarifController');

router.get('/', tarifController.getTarif);
router.post('/', tarifController.updateTarif);

module.exports = router;
