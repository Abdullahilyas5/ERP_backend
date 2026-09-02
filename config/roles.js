const ROLE_PERMISSIONS = {
  owner: ['dashboard', 'users', 'products', 'inventory', 'warehouses', 'suppliers', 'purchaseOrders', 'sales', 'customers', 'pos', 'cms', 'reports', 'payments', 'expenses', 'stockTransfers', 'financialReports'],
  admin: ['dashboard', 'users', 'products', 'inventory', 'warehouses', 'suppliers', 'purchaseOrders', 'sales', 'customers', 'pos', 'cms', 'reports', 'payments'],
  manager: ['dashboard', 'sales', 'inventory', 'warehouses', 'suppliers', 'purchaseOrders', 'customers', 'cms', 'reports'],
  cashier: ['pos', 'sales', 'customers', 'payments'],
  warehouse_staff: ['inventory', 'warehouses', 'stockTransfers', 'suppliers', 'purchaseOrders'],
  accountant: ['dashboard', 'payments', 'expenses', 'financialReports', 'suppliers'],
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
  { key: 'dashboard', label: 'Overview & Insights', route: '/overview', roles: ['owner', 'admin', 'manager', 'accountant'] },
  { key: 'users', label: 'Users', route: '/users', roles: ['owner', 'admin'] },
  { key: 'products', label: 'Products', route: '/products', roles: ['owner', 'admin', 'manager', 'cashier'] },
  { key: 'inventory', label: 'Inventory', route: '/inventory', roles: ['owner', 'admin', 'manager', 'warehouse_staff'] },
  { key: 'suppliers', label: 'Suppliers', route: '/suppliers', roles: ['owner', 'admin', 'manager', 'warehouse_staff', 'accountant'] },
  { key: 'customers', label: 'Customers', route: '/customers', roles: ['owner', 'admin', 'manager', 'cashier'] },
  { key: 'pos', label: 'POS', route: '/pos', roles: ['owner', 'admin', 'cashier'] },
  { key: 'sales', label: 'Sales', route: '/sales', roles: ['owner', 'admin', 'manager', 'cashier'] },
  { key: 'cms', label: 'CMS & Announcements', route: '/cms', roles: ['owner', 'admin', 'manager'] },
  { key: 'reports', label: 'Reports', route: '/reports', roles: ['owner', 'admin', 'manager'] },
  { key: 'stockTransfers', label: 'Stock Transfers', route: '/stock-transfers', roles: ['owner', 'warehouse_staff'] },
  { key: 'payments', label: 'Payments', route: '/payments', roles: ['owner', 'admin', 'cashier', 'accountant'] },
  { key: 'expenses', label: 'Expenses', route: '/expenses', roles: ['owner', 'accountant'] },
  { key: 'financialReports', label: 'Financial Reports', route: '/financial-reports', roles: ['owner', 'accountant'] },
];

module.exports = { ROLE_PERMISSIONS, ROLE_LABELS, MODULES };
