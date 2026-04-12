const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Vérification de la connexion
transporter.verify((error, success) => {
    if (error) {
        console.log("Erreur de configuration Email:", error);
    } else {
        console.log("Le serveur est prêt à envoyer des e-mails");
    }
});

module.exports = transporter;
