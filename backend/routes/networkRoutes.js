const express = require('express');
const router = express.Router();
const networkController = require('../controllers/networkController');

router.get('/count', networkController.getLineCount);
router.get('/', networkController.getNetwork);
router.post('/', networkController.createLineWithTrajets);
router.put('/:id', networkController.updateLine);
router.delete('/:id', networkController.deleteLine);

module.exports = router;
