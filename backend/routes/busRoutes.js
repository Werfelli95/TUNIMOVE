const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const multer = require('multer');
const path = require('path');

// Configuration de Multer pour les images des bus
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/buses/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bus-' + uniqueSuffix + path.extname(file.originalname));
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

// Route pour obtenir la liste des bus
router.get('/', busController.getBuses);
router.post('/', upload.single('image'), busController.createBus);
router.put('/:id', upload.single('image'), busController.updateBus);
router.delete('/:id', busController.deleteBus);
router.get('/active-count', busController.getActiveBusCount);

module.exports = router;
