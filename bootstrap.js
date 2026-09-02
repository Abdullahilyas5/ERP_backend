require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const { ROLE_PERMISSIONS } = require('./config/roles');

const app = express();
// Keep the API port in sync with the client default (NEXT_PUBLIC_API_URL).
const PORT = process.env.PORT || 9000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp';

app.use(cors({ origin: ['http://localhost:3000','https://supermarketerp.vercel.app' ], credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'Supermarket ERP API', status: 'online' }));

// mount api routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/warehouses', require('./routes/warehouse.routes'));
app.use('/api/stock-transfers', require('./routes/stockTransfer.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/sales', require('./routes/sale.routes'));
app.use('/api/suppliers', require('./routes/supplier.routes'));
app.use('/api/purchase-orders', require('./routes/purchaseOrder.routes'));
app.use('/api/posts', require('./routes/post.routes'));
app.use('/api/cms', require('./routes/post.routes'));
app.get('/api/public/posts', require('./controllers/post.controller').listPublicPosts);
// inventory adjustments (POST /api/inventory/adjust) will be handled in inventory.routes

// mount additional modules
app.use('/api/pos', require('./routes/pos.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/expenses', require('./routes/expenses.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.get('/api/financial-reports', require('./middleware/auth.middleware').requireAuth, require('./middleware/auth.middleware').authorize('financialReports'), require('./controllers/financialReports.controller').getFinancialReports);
// NOTE: pos.routes and reports.routes are optional placeholders — if these files are not present the require will throw. Create or adjust as needed.
// roles & modules (read-only config)
app.get('/api/roles', (req, res) => {
  res.json({ roles: Object.entries(require('./config/roles').ROLE_LABELS || {}).map(([key, label]) => ({ key, label, permissions: require('./config/roles').ROLE_PERMISSIONS[key] })), modules: require('./config/roles').MODULES });
});

// dashboard
const { getDashboard } = require('./controllers/dashboard.controller');
app.get('/api/dashboard', require('./middleware/auth.middleware').requireAuth, require('./middleware/auth.middleware').authorize('dashboard'), getDashboard);

const { errorHandler } = require('./middleware/error.middleware');
app.use(errorHandler);

mongoose.set('bufferCommands', false);

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('Connected to MongoDB at', MONGODB_URI);
    app.listen(PORT, () => console.log(`ERP server is running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('MongoDB connection failed. ERP server was not started.', err.message);
    process.exitCode = 1;
  }
}

start();
