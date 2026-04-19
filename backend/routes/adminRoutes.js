const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');

router.get('/roles-overview', adminCtrl.getRolesOverview);

module.exports = router;
