const express = require('express');
const router = express.Router();
const controleurServiceController = require('../controllers/controleurServiceController');

router.get('/reports', controleurServiceController.getAllReports);
router.post('/close', controleurServiceController.closeService);

module.exports = router;
