// Legacy index replaced by modular bootstrap
require('./bootstrap');

const ROLE_PERMISSIONS = {
  owner: ['users', 'products', 'inventory', 'sales', 'customers', 'pos', 'reports', 'payments', 'expenses', 'stockTransfers', 'financialReports'],
  admin: ['users', 'products', 'inventory', 'sales', 'customers', 'pos', 'reports'],
  manager: ['sales', 'inventory', 'customers', 'reports'],
  cashier: ['pos', 'sales', 'customers'],
  warehouse_staff: ['inventory', 'stockTransfers'],
  accountant: ['payments', 'expenses', 'financialReports'],
};

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  cashier: 'Cashier',
  warehouse_staff: 'Warehouse Staff',
  accountant: 'Accountant',
};

const MODULES = [
  { key: 'users', label: 'Users', route: '/users', roles: ['owner', 'admin'] },
  { key: 'products', label: 'Products', route: '/products', roles: ['owner', 'admin', 'manager', 'cashier'] },
  { key: 'inventory', label: 'Inventory', route: '/inventory', roles: ['owner', 'admin', 'manager', 'warehouse_staff'] },
  { key: 'customers', label: 'Customers', route: '/customers', roles: ['owner', 'admin', 'manager', 'cashier'] },
  { key: 'pos', label: 'POS', route: '/pos', roles: ['owner', 'admin', 'cashier'] },
  { key: 'sales', label: 'Sales', route: '/sales', roles: ['owner', 'admin', 'manager', 'cashier'] },
  { key: 'reports', label: 'Reports', route: '/reports', roles: ['owner', 'admin', 'manager'] },
  { key: 'stockTransfers', label: 'Stock Transfers', route: '/stock-transfers', roles: ['owner', 'warehouse_staff'] },
  { key: 'payments', label: 'Payments', route: '/payments', roles: ['owner', 'accountant'] },
  { key: 'expenses', label: 'Expenses', route: '/expenses', roles: ['owner', 'accountant'] },
  { key: 'financialReports', label: 'Financial Reports', route: '/financial-reports', roles: ['owner', 'accountant'] },
];

const productCatalog = [
  { id: 1, sku: 'PRD-1001', name: 'Fresh Milk 1L', category: 'Dairy', price: 3.2, stock: 48, reorderLevel: 20, status: 'In Stock' },
  { id: 2, sku: 'PRD-1044', name: 'Whole Wheat Bread', category: 'Bakery', price: 2.8, stock: 16, reorderLevel: 18, status: 'Low Stock' },
  { id: 3, sku: 'PRD-1107', name: 'Bananas', category: 'Fruit', price: 1.9, stock: 72, reorderLevel: 30, status: 'In Stock' },
  { id: 4, sku: 'PRD-1182', name: 'Rice 5kg', category: 'Groceries', price: 12.5, stock: 21, reorderLevel: 12, status: 'In Stock' },
  { id: 5, sku: 'PRD-1239', name: 'Chicken Breast', category: 'Meat', price: 8.7, stock: 10, reorderLevel: 15, status: 'Low Stock' },
  { id: 6, sku: 'PRD-1298', name: 'Orange Juice', category: 'Beverages', price: 4.6, stock: 34, reorderLevel: 20, status: 'In Stock' },
  { id: 7, sku: 'PRD-1345', name: 'Tomato Sauce', category: 'Canned Goods', price: 2.4, stock: 29, reorderLevel: 15, status: 'In Stock' },
  { id: 8, sku: 'PRD-1412', name: 'Shampoo 500ml', category: 'Personal Care', price: 6.1, stock: 9, reorderLevel: 12, status: 'Low Stock' },
];

const inventoryAlerts = [
  { item: 'Whole Wheat Bread', location: 'Bakery Aisle', current: 16, reorder: 18 },
  { item: 'Chicken Breast', location: 'Cold Storage', current: 10, reorder: 15 },
  { item: 'Shampoo 500ml', location: 'Cleaning Aisle', current: 9, reorder: 12 },
];

const inventoryMoves = [
  { name: 'Stock received', item: 'Rice 5kg', qty: '+32', time: '08:40 AM', status: 'Completed' },
  { name: 'Damaged goods', item: 'Milk 1L', qty: '-6', time: '09:15 AM', status: 'Reviewed' },
  { name: 'Transfer', item: 'Bananas', qty: '+18', time: '10:05 AM', status: 'In Transit' },
  { name: 'Cycle count', item: 'Orange Juice', qty: '+12', time: '11:20 AM', status: 'Approved' },
];

const customers = [
  { id: 1, name: 'Aisha Rahman', phone: '+1 (415) 555-0182', spend: 1842.5, visits: 28, tier: 'Gold', loyalty: 960 },
  { id: 2, name: 'Daniel Lee', phone: '+1 (612) 555-0173', spend: 1256.2, visits: 17, tier: 'Silver', loyalty: 610 },
  { id: 3, name: 'Marta Gomez', phone: '+1 (310) 555-0138', spend: 2410.1, visits: 31, tier: 'Platinum', loyalty: 1450 },
  { id: 4, name: 'Noah Patel', phone: '+1 (206) 555-0112', spend: 985.7, visits: 13, tier: 'Bronze', loyalty: 430 },
];

const salesTransactions = [
  { id: 'INV-2048', customer: 'Aisha Rahman', itemCount: 12, amount: 94.4, channel: 'Card', status: 'Paid' },
  { id: 'INV-2049', customer: 'Daniel Lee', itemCount: 7, amount: 61.8, channel: 'Cash', status: 'Paid' },
  { id: 'INV-2050', customer: 'Walk-in', itemCount: 5, amount: 42.5, channel: 'Card', status: 'Pending' },
  { id: 'INV-2051', customer: 'Marta Gomez', itemCount: 18, amount: 136.9, channel: 'Wallet', status: 'Paid' },
  { id: 'INV-2052', customer: 'Noah Patel', itemCount: 9, amount: 71.3, channel: 'Card', status: 'Refunded' },
];

const posCatalog = [
  { id: 1, name: 'Fresh Milk 1L', price: 3.2 },
  { id: 2, name: 'Whole Wheat Bread', price: 2.8 },
  { id: 3, name: 'Bananas', price: 1.9 },
  { id: 4, name: 'Rice 5kg', price: 12.5 },
  { id: 5, name: 'Chicken Breast', price: 8.7 },
  { id: 6, name: 'Orange Juice', price: 4.6 },
  { id: 7, name: 'Tomato Sauce', price: 2.4 },
  { id: 8, name: 'Shampoo 500ml', price: 6.1 },
];

const payments = [
  { id: 'PAY-101', vendor: 'Metro Food Supply', amount: 12450.6, dueDate: '2026-09-02', status: 'Scheduled' },
  { id: 'PAY-102', vendor: 'Northwind Logistics', amount: 3875.25, dueDate: '2026-09-05', status: 'Pending' },
  { id: 'PAY-103', vendor: 'FreshCo Distribution', amount: 9845.1, dueDate: '2026-09-09', status: 'Approved' },
];

const expenses = [
  { id: 'EXP-221', category: 'Utilities', amount: 342.5, month: 'August', status: 'Recorded' },
  { id: 'EXP-222', category: 'Packaging', amount: 612.2, month: 'August', status: 'Approved' },
  { id: 'EXP-223', category: 'Staff Training', amount: 760.0, month: 'August', status: 'Pending' },
];

const stockTransfers = [
  { id: 'TR-101', from: 'Main Warehouse', to: 'City Center Store', item: 'Rice 5kg', qty: 22, status: 'In Transit' },
  { id: 'TR-102', from: 'Cold Storage', to: 'Downtown Store', item: 'Chicken Breast', qty: 12, status: 'Received' },
  { id: 'TR-103', from: 'Bakery Unit', to: 'Airport Location', item: 'Bread', qty: 15, status: 'Scheduled' },
];

const allUsers = [
  { id: 1, name: 'Owner', email: 'owner@supermarket.com', password: 'owner123', role: 'owner' },
  { id: 2, name: 'System Admin', email: 'admin@supermarket.com', password: 'admin123', role: 'admin' },
  { id: 3, name: 'Store Manager', email: 'manager@supermarket.com', password: 'manager123', role: 'manager' },
  { id: 4, name: 'Cashier', email: 'cashier@supermarket.com', password: 'cashier123', role: 'cashier' },
  { id: 5, name: 'Warehouse Staff', email: 'warehouse@supermarket.com', password: 'warehouse123', role: 'warehouse_staff' },
  { id: 6, name: 'Accountant', email: 'accountant@supermarket.com', password: 'accountant123', role: 'accountant' },
];

const userSeed = allUsers.map((user) => ({
  ...user,
  permissions: ROLE_PERMISSIONS[user.role],
  passwordHash: bcrypt.hashSync(user.password, 10),
}));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: Object.keys(ROLE_PERMISSIONS) },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function connectToMongo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB at', MONGODB_URI);
    const count = await User.countDocuments();
    if (count === 0) {
      await User.insertMany(
        userSeed.map((user) => ({
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role,
          permissions: user.permissions,
          isActive: true,
        })),
      );
      console.log('Seeded default ERP users into MongoDB.');
    }
  } catch (error) {
    console.warn('MongoDB connection failed. Application will use the in-memory seed dataset.', error.message);
  }
}

async function getUserRecordByEmail(email) {
  if (mongoose.connection.readyState === 1) {
    return User.findOne({ email: String(email).toLowerCase() }).lean();
  }
  return userSeed.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

async function getUserRecordById(id) {
  if (mongoose.connection.readyState === 1) {
    return User.findById(id).lean();
  }
  return userSeed.find((user) => user.id === Number(id)) || null;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, password, ...safeUser } = user;
  return {
    ...safeUser,
    permissions: safeUser.permissions || ROLE_PERMISSIONS[safeUser.role] || [],
  };
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' },
  );
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = userSeed.find((entry) => entry.id === Number(decoded.id));
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    req.user = sanitizeUser(user);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function hasPermission(user, moduleKey) {
  if (!user) return false;
  return (user.permissions || ROLE_PERMISSIONS[user.role] || []).includes(moduleKey);
}

function authorize(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!hasPermission(req.user, requiredPermission)) {
      return res.status(403).json({ message: 'You are not authorized to access this module.' });
    }
    return next();
  };
}

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ service: 'Supermarket ERP API', status: 'online' });
});

app.get('/api/roles', (req, res) => {
  res.json({
    roles: Object.entries(ROLE_LABELS).map(([key, label]) => ({
      key,
      label,
      permissions: ROLE_PERMISSIONS[key],
    })),
    modules: MODULES,
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await getUserRecordByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const sanitizedUser = sanitizeUser(user);
  const token = signToken(sanitizedUser);

  return res.json({
    token,
    user: sanitizedUser,
    permissions: sanitizedUser.permissions,
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/dashboard', requireAuth, (req, res) => {
  res.json({
    grossSales: '$18.4K',
    inventoryValue: '$64.2K',
    activeCustomers: 1284,
    transactions: 409,
    products: productCatalog.length,
    alerts: inventoryAlerts.length,
    salesTrend: '+12.4%',
    role: req.user.role,
    permissions: req.user.permissions,
  });
});

app.get('/api/users', requireAuth, authorize('users'), (req, res) => {
  res.json(userSeed.map((user) => sanitizeUser(user)));
});

app.get('/api/products', requireAuth, authorize('products'), (req, res) => {
  res.json(productCatalog);
});

app.post('/api/products', requireAuth, authorize('products'), (req, res) => {
  const { name, sku, category, price, stock, reorderLevel } = req.body || {};
  if (!name || !sku || !category || price == null || stock == null) {
    return res.status(400).json({ message: 'Name, SKU, category, price, and stock are required.' });
  }

  const newProduct = {
    id: productCatalog.length + 1,
    sku,
    name,
    category,
    price: Number(price),
    stock: Number(stock),
    reorderLevel: Number(reorderLevel || 10),
    status: Number(stock) <= Number(reorderLevel || 10) ? 'Low Stock' : 'In Stock',
  };

  productCatalog.push(newProduct);
  return res.status(201).json(newProduct);
});

app.get('/api/inventory', requireAuth, authorize('inventory'), (req, res) => {
  res.json({ alerts: inventoryAlerts, moves: inventoryMoves });
});

app.get('/api/customers', requireAuth, authorize('customers'), (req, res) => {
  res.json(customers);
});

app.get('/api/sales', requireAuth, authorize('sales'), (req, res) => {
  res.json({
    overview: [
      { label: 'Gross Sales', value: '$18.4K', trend: '+12.4%' },
      { label: 'Avg. Basket', value: '$42.30', trend: '+5.8%' },
      { label: 'Orders', value: '409', trend: '+9.1%' },
      { label: 'Returns', value: '12', trend: '-2.3%' },
    ],
    transactions: salesTransactions,
  });
});

app.get('/api/pos/items', requireAuth, authorize('pos'), (req, res) => {
  res.json(posCatalog);
});

app.post('/api/pos/checkout', requireAuth, authorize('pos'), (req, res) => {
  const { items = [] } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'At least one item is required to complete checkout.' });
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const tax = subtotal * 0.08;

  return res.status(201).json({
    invoiceId: `INV-${Date.now()}`,
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number((subtotal + tax).toFixed(2)),
    status: 'Paid',
  });
});

app.get('/api/reports', requireAuth, authorize('reports'), (req, res) => {
  res.json({
    summary: {
      sales: '$18.4K',
      inventory: '$64.2K',
      profitability: '26.8%',
      growth: '+12.4%',
    },
    topCategories: ['Bakery', 'Dairy', 'Produce', 'Household'],
  });
});

app.get('/api/stock-transfers', requireAuth, authorize('stockTransfers'), (req, res) => {
  res.json(stockTransfers);
});

app.get('/api/payments', requireAuth, authorize('payments'), (req, res) => {
  res.json(payments);
});

app.get('/api/expenses', requireAuth, authorize('expenses'), (req, res) => {
  res.json(expenses);
});

app.get('/api/financial-reports', requireAuth, authorize('financialReports'), (req, res) => {
  res.json({
    netProfit: '$43.2K',
    expenses: '$18.6K',
    outstanding: '$12.1K',
    cashFlow: '+8.4%',
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

connectToMongo();

app.listen(PORT, () => {
  console.log(`ERP server is running on http://localhost:${PORT}`);
});