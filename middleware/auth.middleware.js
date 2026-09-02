const { verifyToken } = require('../services/auth.service');
const { ROLE_PERMISSIONS } = require('../config/roles');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  const user = await verifyToken(token);
  if (!user) return res.status(401).json({ message: 'Invalid or expired token.' });
  // normalize permissions
  user.permissions = user.permissionsConfigured ? (user.permissions || []) : ROLE_PERMISSIONS[user.role] || [];
  req.user = { id: user._id || user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions };
  return next();
}

function hasPermission(user, moduleKey) {
  if (!user) return false;
  return (user.permissions || ROLE_PERMISSIONS[user.role] || []).includes(moduleKey);
}

function authorize(permissionKey) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required.' });
    if (!hasPermission(req.user, permissionKey)) return res.status(403).json({ message: 'You are not authorized to access this module.' });
    return next();
  };
}

function authorizeAny(...permissionKeys) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required.' });
    if (!permissionKeys.some((permissionKey) => hasPermission(req.user, permissionKey))) {
      return res.status(403).json({ message: 'You are not authorized to access this module.' });
    }
    return next();
  };
}

module.exports = { requireAuth, authorize, authorizeAny };
