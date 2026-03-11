import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../apiFetch';

export default function TenantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    apiFetch(`/api/clients/${id}`).then(r => r.json()).then(t => {
      setForm({ name: t.name, phone: t.phone || '', email: t.email || '', address: t.address || '' });
    });
  }, [id, isEdit]);

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
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
      setError(data.error || 'Failed to save tenant.');
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
        </div>

        {error && <div style={{ marginTop: 12, color: 'var(--danger)', fontWeight: 500 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Tenant'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/tenants')}>Cancel</button>
        </div>
      </form>
    </main>
  );
}
