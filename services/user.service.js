const userRepo = require('../repositories/user.repository');

async function createUser(data) {
  return userRepo.createUser(data);
}

async function listUsers() {
  return userRepo.listUsers();
}

async function getUserById(id) {
  return userRepo.findById(id);
}

async function updateUser(id, patch) {
  return userRepo.updateUser(id, patch);
}

async function deleteUser(id) {
  return userRepo.deleteUser(id);
}

module.exports = { createUser, listUsers, getUserById, updateUser, deleteUser };
