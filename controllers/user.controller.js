const userService = require('../services/user.service');

async function listUsers(req, res) {
  try {
    const requestedPage = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const requestedLimit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const users = await userService.listUsers({ skip: (requestedPage - 1) * requestedLimit, limit: requestedLimit });
    const safe = users.items.map((u) => ({ id: u._id || u.id, name: u.name, email: u.email, role: u.role, permissions: u.permissions, permissionsConfigured: u.permissionsConfigured, isActive: u.isActive, approvalStatus: u.approvalStatus || (u.isActive ? 'approved' : 'pending') }));
    return res.json({ items: safe, total: users.total, page: users.page, limit: users.limit, totalPages: users.totalPages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role, permissions } = req.body || {};
    if (!name || !email || !password || !role) return res.status(400).json({ message: 'name, email, password and role are required.' });
    if (req.user.role !== 'owner') return res.status(403).json({ message: 'Only the owner can create staff accounts.' });
    const user = await userService.createUser({ name, email, password, role, permissions });
    return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions, isActive: user.isActive, approvalStatus: user.approvalStatus });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) return res.status(409).json({ message: 'Email already in use.' });
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getUser(req, res) {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const safe = { id: user._id || user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions, permissionsConfigured: user.permissionsConfigured, isActive: user.isActive, approvalStatus: user.approvalStatus || (user.isActive ? 'approved' : 'pending') };
    return res.json(safe);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function updateUser(req, res) {
  try {
    if (req.body?.password) {
      return res.status(403).json({ message: 'Password changes must use the secure password reset flow.' });
    }
    if (req.user.role !== 'owner' && (req.body?.role || req.body?.permissions || req.body?.isActive !== undefined || req.body?.approvalStatus)) {
      return res.status(403).json({ message: 'Only the owner can change roles, permissions, or account activation.' });
    }
    const allowed = ['name', 'email'];
    if (req.user.role === 'owner') allowed.push('role', 'permissions');
    const patch = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'permissions')) patch.permissionsConfigured = true;
    // Prevent owners from changing other users' passwords. Owners may change roles but not reset passwords of other users.
    if (req.body && req.body.password && req.user && req.user.role === 'owner' && String(req.user.id) !== String(req.params.id)) {
      return res.status(403).json({ message: "Owners may not change other users' passwords; only role updates are permitted." });
    }

    const updated = await userService.updateUser(req.params.id, patch);
    if (!updated) return res.status(404).json({ message: 'User not found.' });
    const safe = { id: updated._id || updated.id, name: updated.name, email: updated.email, role: updated.role, permissions: updated.permissions, permissionsConfigured: updated.permissionsConfigured, isActive: updated.isActive, approvalStatus: updated.approvalStatus };
    return res.json(safe);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }

}

async function approveUser(req, res) {
  try {
    if (req.user.role !== 'owner') return res.status(403).json({ message: 'Only the owner can approve user accounts.' });
    const updated = await userService.approveUser(req.params.id, req.user.id);
    if (!updated) return res.status(404).json({ message: 'User not found.' });
    return res.json({ id: updated._id, name: updated.name, email: updated.email, role: updated.role, permissions: updated.permissions, isActive: updated.isActive, approvalStatus: updated.approvalStatus });
  } catch (err) {
    console.error('approveUser error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function setActive(req, res) {
  try {
    if (req.user.role !== 'owner') return res.status(403).json({ message: 'Only the owner can activate or deactivate users.' });
    const updated = await userService.setUserActive(req.params.id, req.body?.isActive === true, req.user.id);
    if (!updated) return res.status(404).json({ message: 'User not found.' });
    return res.json({ id: updated._id, name: updated.name, email: updated.email, role: updated.role, permissions: updated.permissions, isActive: updated.isActive, approvalStatus: updated.approvalStatus });
  } catch (err) {
    console.error('setActive error', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function deleteUser(req, res) {
  try {
    await userService.deleteUser(req.params.id);
    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { listUsers, createUser, getUser, updateUser, approveUser, setActive, deleteUser };
