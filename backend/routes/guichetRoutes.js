const express = require('express');
const router = express.Router();
const guichetController = require('../controllers/guichetController');

router.get('/', guichetController.getGuichets);
router.get('/stats', guichetController.getGuichetStats);
router.get('/available-agents', guichetController.getAvailableAgents);
router.get('/agent/:id', guichetController.getGuichetByAgent);
router.post('/update', guichetController.updateAssignment);
router.post('/status', guichetController.updateStatus);
router.post('/', guichetController.createGuichet);
router.delete('/:id', guichetController.deleteGuichet);

module.exports = router;
