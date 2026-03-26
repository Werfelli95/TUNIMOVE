const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route pour récupérer tous les utilisateurs
router.get('/', userController.getUsers);
router.get('/count', userController.getUserCount);
router.post('/', userController.createUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id/block', userController.toggleBlockUser);
router.get('/:id', userController.getUserById);

module.exports = router;
