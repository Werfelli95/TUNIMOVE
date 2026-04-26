const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');

router.get('/roles-overview', adminCtrl.getRolesOverview);
router.get('/notifications', adminCtrl.getNotificationsCount);

module.exports = router;
