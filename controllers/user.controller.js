const userService = require('../services/user.service');

async function listUsers(req, res) {
  try {
    const users = await userService.listUsers();
    const safe = users.map((u) => ({ id: u._id || u.id, name: u.name, email: u.email, role: u.role, permissions: u.permissions }));
    return res.json(safe);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role, permissions } = req.body || {};
    if (!name || !email || !password || !role) return res.status(400).json({ message: 'name, email, password and role are required.' });
    const user = await userService.createUser({ name, email, password, role, permissions });
    return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions });
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
    const safe = { id: user._id || user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions };
    return res.json(safe);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function updateUser(req, res) {
  try {
    // Prevent owners from changing other users' passwords. Owners may change roles but not reset passwords of other users.
    if (req.body && req.body.password && req.user && req.user.role === 'owner' && String(req.user.id) !== String(req.params.id)) {
      return res.status(403).json({ message: "Owners may not change other users' passwords; only role updates are permitted." });
    }

    const updated = await userService.updateUser(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ message: 'User not found.' });
    const safe = { id: updated._id || updated.id, name: updated.name, email: updated.email, role: updated.role, permissions: updated.permissions };
    return res.json(safe);
  } catch (err) {
    console.error(err);
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

module.exports = { listUsers, createUser, getUser, updateUser, deleteUser };
