const express = require('express');
const router = express.Router();
const db = require('../db');

function parseItems(inv) {
  return { ...inv, items: typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items };
}

// GET /api/invoices
router.get('/', (req, res) => {
  const invoices = db.prepare('SELECT * FROM invoices WHERE user_id = ? ORDER BY date_created DESC').all(req.userId);
  res.json(invoices.map(parseItems));
});

// POST /api/invoices
router.post('/', (req, res) => {
  const inv = req.body;
  const stmt = db.prepare(`
    INSERT INTO invoices
      (user_id, invoice_number, client_name, client_email, client_address, date_created, due_date, status, items, tax_rate, subtotal, tax_amount, total, notes)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  try {
    const result = stmt.run(
      req.userId,
      inv.invoice_number, inv.client_name, inv.client_email || '', inv.client_address || '',
      inv.date_created, inv.due_date, inv.status || 'unpaid',
      JSON.stringify(inv.items || []),
      inv.tax_rate || 0, inv.subtotal || 0, inv.tax_amount || 0, inv.total || 0,
      inv.notes || ''
    );
    const created = db.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(parseItems(created));
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: `Invoice number "${inv.invoice_number}" already exists.` });
    }
    throw err;
  }
});

// GET /api/invoices/:id
router.get('/:id', (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  res.json(parseItems(inv));
});

// PUT /api/invoices/:id
router.put('/:id', (req, res) => {
  const inv = req.body;
  const stmt = db.prepare(`
    UPDATE invoices SET
      invoice_number = ?, client_name = ?, client_email = ?, client_address = ?,
      date_created = ?, due_date = ?, status = ?, items = ?,
      tax_rate = ?, subtotal = ?, tax_amount = ?, total = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `);
  try {
    const result = stmt.run(
      inv.invoice_number, inv.client_name, inv.client_email || '', inv.client_address || '',
      inv.date_created, inv.due_date, inv.status || 'unpaid',
      JSON.stringify(inv.items || []),
      inv.tax_rate || 0, inv.subtotal || 0, inv.tax_amount || 0, inv.total || 0,
      inv.notes || '', req.params.id, req.userId
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
    const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    res.json(parseItems(updated));
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: `Invoice number "${inv.invoice_number}" already exists.` });
    }
    throw err;
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ success: true });
});

module.exports = router;
