
async function createUser(data) {
  return userRepo.createUser(data);
}

async function listUsers(options) {
  return userRepo.listUsers(options);
}

async function getUserById(id) {
  return userRepo.findById(id);
}

async function updateUser(id, patch) {
  return userRepo.updateUser(id, patch);
}

async function approveUser(id, approvedBy) {
  return userRepo.approveUser(id, approvedBy);
}

async function setUserActive(id, isActive, approvedBy) {
  return userRepo.setUserActive(id, isActive, approvedBy);
}

async function deleteUser(id) {
  return userRepo.deleteUser(id);
}

module.exports = { createUser, listUsers, getUserById, updateUser, approveUser, setUserActive, deleteUser };
const userRepo = require('../repositories/user.repository');
