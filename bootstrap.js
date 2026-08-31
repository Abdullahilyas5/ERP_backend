require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const userRepo = require('./repositories/user.repository');
const { ROLE_PERMISSIONS } = require('./config/roles');

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp';

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/', (req, res) => res.json({ service: 'Supermarket ERP API', status: 'online' }));

// mount api routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/stock-transfers', require('./routes/stockTransfer.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/sales', require('./routes/sale.routes'));
// mount additional modules
app.use('/api/pos', require('./routes/pos.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/expenses', require('./routes/expenses.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
// NOTE: pos.routes and reports.routes are optional placeholders — if these files are not present the require will throw. Create or adjust as needed.

// roles & modules (read-only config)
app.get('/api/roles', (req, res) => {
  res.json({ roles: Object.entries(require('./config/roles').ROLE_LABELS || {}).map(([key, label]) => ({ key, label, permissions: require('./config/roles').ROLE_PERMISSIONS[key] })), modules: require('./config/roles').MODULES });
});

// dashboard
const { getDashboard } = require('./controllers/dashboard.controller');
app.get('/api/dashboard', require('./middleware/auth.middleware').requireAuth, getDashboard);

const { errorHandler } = require('./middleware/error.middleware');
app.use(errorHandler);

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB at', MONGODB_URI);
    // seed default users if none
    const defaultUsers = [
      { name: 'Owner', email: 'owner@supermarket.com', password: 'owner123', role: 'owner' },
      { name: 'System Admin', email: 'admin@supermarket.com', password: 'admin123', role: 'admin' },
      { name: 'Store Manager', email: 'manager@supermarket.com', password: 'manager123', role: 'manager' },
      { name: 'Cashier', email: 'cashier@supermarket.com', password: 'cashier123', role: 'cashier' },
      { name: 'Warehouse Staff', email: 'warehouse@supermarket.com', password: 'warehouse123', role: 'warehouse_staff' },
      { name: 'Accountant', email: 'accountant@supermarket.com', password: 'accountant123', role: 'accountant' },
    ];
    const seeded = await userRepo.seedDefaultUsers(defaultUsers);
    if (seeded) console.log('Seeded default users');

    app.listen(PORT, () => console.log(`ERP server is running on http://localhost:${PORT}`));
  } catch (err) {
    console.warn('MongoDB connection failed. Server will still run but data persistence is disabled.', err.message);
    app.listen(PORT, () => console.log(`ERP server (no DB) running on http://localhost:${PORT}`));
  }
}

start();
