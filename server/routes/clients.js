const express = require('express');
const router = express.Router();
const db = require('../db');
const dns = require('dns').promises;

async function emailDomainExists(email) {
  const domain = email.split('@')[1];
  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    return records && records.length > 0;
  } catch (err) {
    if (err.message === 'timeout') return null; // DNS slow — allow through
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'ESERVFAIL') return false; // domain doesn't exist
    return null; // other unknown error — allow through
  }
}

function validateClient({ name, email, phone, address, monthly_rent, late_fee }) {
  if (!name || !name.trim()) return 'Name is required.';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!email || !emailRegex.test(email)) return 'A valid email address is required.';

  if (phone) {
    const digits = phone.replace(/\D/g, '');
    const valid = digits.length === 10 || (digits.length === 11 && digits[0] === '1');
    if (!valid) return 'Phone number must be 10 digits.';
  }

  if (address && (!/\d/.test(address) || address.trim().length < 5))
    return 'Address must include a street number (e.g. 123 Main St).';

  const rent = parseFloat(monthly_rent);
  if (isNaN(rent) || rent <= 0) return 'Monthly rent must be greater than $0.';
  if (rent > 50000) return 'Monthly rent exceeds the maximum allowed ($50,000).';

  if (late_fee !== undefined && late_fee !== '') {
    const fee = parseFloat(late_fee);
    if (isNaN(fee) || fee < 0) return 'Late fee cannot be negative.';
    if (fee > 10000) return 'Late fee exceeds the maximum allowed ($10,000).';
  }

  return null;
}

// GET /api/clients
router.get('/', async (req, res) => {
  const result = await db.query('SELECT * FROM clients WHERE user_id = $1 ORDER BY name ASC', [req.userId]);
  res.json(result.rows);
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  const result = await db.query('SELECT * FROM clients WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Tenant not found' });
  res.json(result.rows[0]);
});

// POST /api/clients
router.post('/', async (req, res) => {
  const user = (await db.query('SELECT plan FROM users WHERE id = $1', [req.userId])).rows[0];
  if (user?.plan === 'free') {
    const { rows } = await db.query('SELECT COUNT(*) as count FROM clients WHERE user_id = $1', [req.userId]);
    if (parseInt(rows[0].count) >= 3) {
      return res.status(403).json({ error: 'upgrade_required', limit: 'tenants', message: 'Free plan is limited to 3 tenants. Upgrade to Pro for unlimited.' });
    }
  }

  const { name, address, phone, email, monthly_rent, recurring_enabled, recurring_day, late_fee } = req.body;

  const validationError = validateClient(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const domainOk = await emailDomainExists(email);
  if (domainOk === false) return res.status(400).json({ error: 'Email domain does not appear to exist. Please check the email address.' });

  const result = await db.query(
    'INSERT INTO clients (user_id, name, address, phone, email, monthly_rent, recurring_enabled, recurring_day, late_fee) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [req.userId, name, address || '', phone || '', email || '', monthly_rent || 0, recurring_enabled || false, recurring_day || 1, late_fee || 0]
  );
  res.status(201).json(result.rows[0]);
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  const { name, address, phone, email, monthly_rent, recurring_enabled, recurring_day, late_fee } = req.body;

  const validationError = validateClient(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const domainOk = await emailDomainExists(email);
  if (domainOk === false) return res.status(400).json({ error: 'Email domain does not appear to exist. Please check the email address.' });

  const result = await db.query(
    'UPDATE clients SET name = $1, address = $2, phone = $3, email = $4, monthly_rent = $5, recurring_enabled = $6, recurring_day = $7, late_fee = $8 WHERE id = $9 AND user_id = $10 RETURNING *',
    [name, address || '', phone || '', email || '', monthly_rent || 0, recurring_enabled || false, recurring_day || 1, late_fee || 0, req.params.id, req.userId]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Client not found' });
  res.json(result.rows[0]);
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  const result = await db.query('DELETE FROM clients WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Client not found' });
  res.json({ success: true });
});

module.exports = router;
