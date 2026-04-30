const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');

// Configuration de Multer pour les images des utilisateurs
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/users/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5Mo
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Seules les images (jpeg, jpg, png, webp) sont autorisées !"));
    }
});


// Route pour récupérer tous les utilisateurs
router.get('/', userController.getUsers);
router.get('/count', userController.getUserCount);
router.post('/', upload.single('image'), userController.createUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id/block', userController.toggleBlockUser);
router.get('/:id', userController.getUserById);
router.put('/:id', upload.single('image'), userController.updateUser);
router.patch('/:id/role', userController.updateUserRole);

module.exports = router;
