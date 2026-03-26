const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

router.get('/', auditController.getAuditRecords);
router.put('/:id/status', auditController.updateAuditStatus);

module.exports = router;
