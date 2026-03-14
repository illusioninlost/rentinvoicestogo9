import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../apiFetch';
import UpgradeNotice from '../components/UpgradeNotice';

export default function TenantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', monthly_rent: '', late_fee: '', recurring_enabled: false, recurring_day: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    apiFetch(`/api/clients/${id}`).then(r => r.json()).then(t => {
      setForm({ name: t.name, phone: t.phone || '', email: t.email || '', address: t.address || '', monthly_rent: t.monthly_rent || '', late_fee: t.late_fee || '', recurring_enabled: t.recurring_enabled || false, recurring_day: t.recurring_day || 1 });
    });
  }, [id, isEdit]);

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function validate() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(form.email)) return 'Please enter a valid email address (e.g. name@example.com).';

    if (form.phone) {
      const digits = form.phone.replace(/\D/g, '');
      const valid = digits.length === 10 || (digits.length === 11 && digits[0] === '1');
      if (!valid) return 'Phone number must be 10 digits (e.g. (555) 000-0000).';
    }

    if (!/\d/.test(form.address) || form.address.trim().length < 5)
      return 'Address must include a street number (e.g. 123 Main St, City, ST 00000).';

    const rent = parseFloat(form.monthly_rent);
    if (isNaN(rent) || rent <= 0) return 'Monthly rent must be greater than $0.';
    if (rent > 50000) return 'Monthly rent exceeds the maximum allowed ($50,000).';

    if (form.late_fee) {
      const fee = parseFloat(form.late_fee);
      if (fee < 0) return 'Late fee cannot be negative.';
      if (fee > 10000) return 'Late fee exceeds the maximum allowed ($10,000).';
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError(null);
    const url = isEdit ? `/api/clients/${id}` : '/api/clients';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error === 'upgrade_required' ? data : (data.error || 'Failed to save tenant.'));
      setSaving(false);
      return;
    }
    navigate('/tenants');
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1>{isEdit ? 'Edit Tenant' : 'New Tenant'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 24 }}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Name</label>
            <input required value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Full name" />
          </div>
          <div className="form-grid" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="(555) 000-0000" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input required type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="tenant@email.com" />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <input required value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Mailing address" />
          </div>
          <div className="form-grid" style={{ marginTop: 14 }}>
            <div className="form-group">
              <label>Monthly Rent ($)</label>
              <input required type="number" min="0" step="0.01" value={form.monthly_rent} onChange={e => setField('monthly_rent', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Late Fee ($) <span className="auth-label-hint">auto-added when overdue</span></label>
              <input type="number" min="0" step="0.01" value={form.late_fee} onChange={e => setField('late_fee', e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: form.recurring_enabled ? 12 : 0 }}>
            <input
              type="checkbox"
              id="recurring_enabled"
              checked={form.recurring_enabled}
              onChange={e => setField('recurring_enabled', e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="recurring_enabled" style={{ cursor: 'pointer', fontWeight: 500, margin: 0 }}>
              Auto-generate monthly invoice
            </label>
          </div>
          {form.recurring_enabled && (
            <div className="form-group" style={{ marginTop: 10 }}>
              <label>Generate on day <strong>{form.recurring_day}</strong> of each month</label>
              <input
                type="range"
                min="1"
                max="28"
                value={form.recurring_day}
                onChange={e => setField('recurring_day', parseInt(e.target.value))}
                style={{ width: '100%', marginTop: 6 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                <span>1st</span><span>7th</span><span>14th</span><span>21st</span><span>28th</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                A "Monthly Rent" invoice will be created automatically each month on day {form.recurring_day}. Due date is set 30 days out.
              </p>
            </div>
          )}
        </div>

        {error && (error.error === 'upgrade_required'
          ? <UpgradeNotice message={error.message} />
          : <div style={{ marginTop: 12, color: 'var(--danger)', fontWeight: 500 }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Tenant'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/tenants')}>Cancel</button>
        </div>
      </form>
    </main>
  );
}
