import { useState, useEffect } from 'react';
import { apiFetch } from '../apiFetch';

export default function CompanySettings() {
  const [form, setForm] = useState({ company_name: '', company_address: '', company_phone: '', company_email: '' });
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    apiFetch('/api/auth/profile').then(r => r.json()).then(data => {
      setForm({
        company_name: data.company_name || '',
        company_address: data.company_address || '',
        company_phone: data.company_phone || '',
        company_email: data.company_email || '',
      });
      if (data.company_logo) setLogoPreview(data.company_logo);
      setLoadingProfile(false);
    });
  }, []);

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File must be an image (PNG, JPG, etc.).');
      return;
    }
    if (file.size > 512000) {
      setError('Logo image must be smaller than 500KB.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const res = await apiFetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, company_logo: logoPreview }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to save settings.');
    } else {
      setSuccess(true);
    }
    setSaving(false);
  }

  if (loadingProfile) return <main className="page"><p className="text-muted">Loading…</p></main>;

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Company Settings</h1>
          <p className="text-muted" style={{ marginTop: 4, fontSize: 13 }}>This information appears on invoices sent to tenants.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 24 }}>
          {success && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#14532d' }}>
              <span>Settings saved successfully.</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSuccess(false)} style={{ color: '#14532d', padding: '2px 8px' }}>✕</button>
            </div>
          )}
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#7f1d1d' }}>
              <span>{error}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setError(null)} style={{ color: '#7f1d1d', padding: '2px 8px' }}>✕</button>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label>Company Name</label>
            <input
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              placeholder="Your Company LLC"
            />
            <span className="text-muted" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>Replaces "RentInvoicesToGo" on your invoices</span>
          </div>

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label>Company Address</label>
            <textarea
              value={form.company_address}
              onChange={e => setForm(f => ({ ...f, company_address: e.target.value }))}
              placeholder="123 Main St, City, ST 00000"
              rows={3}
            />
          </div>

          <div className="form-grid" style={{ marginBottom: 18 }}>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={form.company_phone}
                onChange={e => setForm(f => ({ ...f, company_phone: e.target.value }))}
                placeholder="(555) 000-0000"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.company_email}
                onChange={e => setForm(f => ({ ...f, company_email: e.target.value }))}
                placeholder="billing@yourbusiness.com"
              />
            </div>
          </div>

          <hr className="divider" />

          <div className="form-group">
            <label>Company Logo</label>
            <span className="text-muted" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>PNG or JPG, max 500KB. Appears on web and print view.</span>

            {logoPreview && (
              <div style={{ marginBottom: 12 }}>
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{ maxHeight: 80, maxWidth: 240, display: 'block', borderRadius: 6, border: '1px solid var(--border)' }}
                />
              </div>
            )}

            <input type="file" accept="image/*" onChange={handleLogoUpload} />

            {logoPreview && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--danger)', marginTop: 10, display: 'block' }}
                onClick={() => setLogoPreview(null)}
              >
                Remove logo
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </main>
  );
}
