const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const busRoutes = require('./routes/busRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const networkRoutes = require('./routes/networkRoutes');
const tarifRoutes = require('./routes/tarifRoutes');
const auditRoutes = require('./routes/auditRoutes');
const saleRoutes = require('./routes/saleRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/tarifs', tarifRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/Sales', saleRoutes);
app.get('/', (req, res) => {
    res.send('TuniMove API is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
