const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const busRoutes = require('./routes/busRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const networkRoutes = require('./routes/networkRoutes');
const tarifRoutes = require('./routes/tarifRoutes');
const tarificationRoutes = require('./routes/tarificationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const saleRoutes = require('./routes/saleRoutes');
const guichetRoutes = require('./routes/guichetRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const receveurServiceRoutes = require('./routes/receveurServiceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const affectationServiceRoutes = require('./routes/affectationServiceRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/tarifs', tarifRoutes);
app.use('/api/tarification', tarificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/guichets', guichetRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/receveur-service', receveurServiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/affectations', affectationServiceRoutes);

app.get('/', (req, res) => {
    res.send('TuniMove API is running...');
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.message);
    res.status(500).json({ message: err.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
