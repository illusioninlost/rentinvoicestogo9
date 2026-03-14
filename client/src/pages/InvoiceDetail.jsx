import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../apiFetch';
import ConfirmModal from '../components/ConfirmModal';

function fmt(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_TOOLTIPS = {
  paid: 'Payment received',
  unpaid: 'Payment not yet received',
  overdue: 'Past due date — payment not received',
};

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`} data-tooltip={STATUS_TOOLTIPS[status]}>{status}</span>;
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // null | 'sending' | 'success' | 'error'
  const [emailError, setEmailError] = useState(null);

  useEffect(() => {
    apiFetch(`/api/invoices/${id}`).then(r => r.json()).then(setInv);
  }, [id]);

  async function handleEmail() {
    setEmailStatus('sending');
    setEmailError(null);
    const res = await apiFetch(`/api/invoices/${id}/email`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setEmailStatus('error');
      setEmailError(data.error || 'Failed to send email.');
    } else {
      setEmailStatus('success');
    }
  }

  async function handleDelete() {
    await apiFetch(`/api/invoices/${id}`, { method: 'DELETE' });
    navigate('/');
  }

  if (!inv) return <main className="page"><p className="text-muted">Loading…</p></main>;

  return (
    <>
    <main className="page">
      <div className="invoice-actions">
        <Link to="/" className="btn btn-secondary btn-sm" data-tooltip="Back to invoice list">← Back</Link>
        <Link to={`/invoices/${id}/edit`} className="btn btn-secondary btn-sm" data-tooltip="Edit this invoice">Edit</Link>
        <button className="btn btn-danger btn-sm" data-tooltip="Permanently delete this invoice" onClick={() => setShowConfirm(true)}>Delete</button>
        <button className="btn btn-secondary btn-sm" data-tooltip="Send invoice to tenant's email" onClick={handleEmail} disabled={emailStatus === 'sending'}>
          {emailStatus === 'sending' ? 'Sending…' : 'Email to Tenant'}
        </button>
        <button className="btn btn-primary btn-sm" data-tooltip="Open print dialog to save as PDF" onClick={() => window.print()}>Print / PDF</button>
      </div>

      {emailStatus === 'success' && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#14532d' }}>
          <span>Email sent to <strong>{inv.client_email}</strong> successfully.</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setEmailStatus(null)} style={{ color: '#14532d', padding: '2px 8px' }}>✕</button>
        </div>
      )}
      {emailStatus === 'error' && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#7f1d1d' }}>
          <span>{emailError}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setEmailStatus(null)} style={{ color: '#7f1d1d', padding: '2px 8px' }}>✕</button>
        </div>
      )}

      <div className="invoice-detail">
        <div className="invoice-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                <path d="M9 21V12h6v9"/>
              </svg>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)', letterSpacing: -0.5 }}>RentInvoicesToGo</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{inv.invoice_number}</div>
          </div>
          <div className="invoice-meta">
            <StatusBadge status={inv.status} />
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
              <div>Invoice Date: <strong>{inv.date_created}</strong></div>
              <div>Payment Due: <strong>{inv.due_date}</strong></div>
            </div>
          </div>
        </div>

        {inv.property_address && (
          <div style={{ marginBottom: 24 }}>
            <div className="invoice-section-label">Rental Property</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.property_address}</div>
          </div>
        )}

        <div className="invoice-from-to">
          <div>
            <div className="invoice-section-label">Bill To</div>
            <div style={{ fontWeight: 600 }}>{inv.client_name}</div>
            {inv.client_address && <div style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'pre-line', marginTop: 2 }}>{inv.client_address}</div>}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, i) => (
                <tr key={i}>
                  <td>{it.description || <span className="text-muted">—</span>}</td>
                  <td className="text-right">{it.quantity}</td>
                  <td className="text-right">{fmt(it.unit_price)}</td>
                  <td className="text-right">{fmt(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-totals">
          <div className="invoice-total-row grand">
            <span>Total Due</span>
            <span>{fmt(inv.total)}</span>
          </div>
        </div>

        {inv.notes && (
          <>
            <hr className="divider" />
            <div>
              <div className="invoice-section-label">Notes</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>{inv.notes}</p>
            </div>
          </>
        )}
      </div>
    </main>

    {showConfirm && (
      <ConfirmModal
        message="Delete this invoice? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    )}
    </>
  );
}
