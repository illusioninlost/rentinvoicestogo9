const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/clients
router.get('/', (req, res) => {
  const clients = db.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC').all(req.userId);
  res.json(clients);
});

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!client) return res.status(404).json({ error: 'Tenant not found' });
  res.json(client);
});

// POST /api/clients
router.post('/', (req, res) => {
  const { name, address, phone, email } = req.body;
  const result = db.prepare(
    'INSERT INTO clients (user_id, name, address, phone, email) VALUES (?, ?, ?, ?, ?)'
  ).run(req.userId, name, address || '', phone || '', email || '');
  const created = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/clients/:id
router.put('/:id', (req, res) => {
  const { name, address, phone, email } = req.body;
  const result = db.prepare(
    'UPDATE clients SET name = ?, address = ?, phone = ?, email = ? WHERE id = ? AND user_id = ?'
  ).run(name, address || '', phone || '', email || '', req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Client not found' });
  const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Client not found' });
  res.json({ success: true });
});

module.exports = router;
