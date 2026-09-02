const repo = require('../repositories/stockTransfer.repository');

async function list(req, res) {
  try {
    const items = await repo.listTransfers({}, {});
    res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error.' }); }
}
async function create(req, res) {
  try {
    const created = await repo.createTransfer({ ...(req.body || {}), createdBy: req.user?.id, requestedBy: req.user?.id });
    res.status(201).json(created);
  } catch (err) {
    console.error('create stock transfer error', err);
    const clientError = /required|different|greater than zero|insufficient stock|not found/i.test(err.message || '');
    res.status(clientError ? 400 : 500).json({ message: clientError ? err.message : 'Internal server error.' });
  }
}
async function get(req, res) { try { const it = await repo.getTransferById(req.params.id); if (!it) return res.status(404).json({ message: 'Not found' }); res.json(it); } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error.' }); } }
async function update(req, res) { try { const updated = await repo.updateTransfer(req.params.id, req.body || {}); if (!updated) return res.status(404).json({ message: 'Not found' }); res.json(updated); } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error.' }); } }
async function remove(req, res) { try { await repo.deleteTransfer(req.params.id); res.status(204).end(); } catch (err) { console.error(err); res.status(500).json({ message: 'Internal server error.' }); } }

module.exports = { list, create, get, update, remove };
