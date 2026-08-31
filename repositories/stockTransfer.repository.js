const StockTransfer = require('../models/stockTransfer.model');

async function createTransfer(data) { return (new StockTransfer(data)).save(); }
async function listTransfers(filter = {}, opts = {}) { const { skip = 0, limit = 100 } = opts; return StockTransfer.find(filter).skip(skip).limit(limit).lean(); }
async function getTransferById(id) { return StockTransfer.findById(id).lean(); }
async function updateTransfer(id, patch) { return StockTransfer.findByIdAndUpdate(id, patch, { new: true }).lean(); }
async function deleteTransfer(id) { return StockTransfer.findByIdAndDelete(id); }

module.exports = { createTransfer, listTransfers, getTransferById, updateTransfer, deleteTransfer };
