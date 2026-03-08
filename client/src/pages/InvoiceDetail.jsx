import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../apiFetch';
import ConfirmModal from '../components/ConfirmModal';

function fmt(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    apiFetch(`/api/invoices/${id}`).then(r => r.json()).then(setInv);
  }, [id]);

  async function handleDelete() {
    await apiFetch(`/api/invoices/${id}`, { method: 'DELETE' });
    navigate('/');
  }

  if (!inv) return <main className="page"><p className="text-muted">Loading…</p></main>;

  return (
    <>
    <main className="page">
      <div className="invoice-actions">
        <Link to="/" className="btn btn-secondary btn-sm">← Back</Link>
        <Link to={`/invoices/${id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
        <button className="btn btn-danger btn-sm" onClick={() => setShowConfirm(true)}>Delete</button>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Print / PDF</button>
      </div>

      <div className="invoice-detail">
        <div className="invoice-header">
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)', letterSpacing: -0.5 }}>InvoicesToGo</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{inv.invoice_number}</div>
          </div>
          <div className="invoice-meta">
            <StatusBadge status={inv.status} />
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
              <div>Date: <strong>{inv.date_created}</strong></div>
              <div>Due: <strong>{inv.due_date}</strong></div>
            </div>
          </div>
        </div>

        <div className="invoice-from-to">
          <div>
            <div className="invoice-section-label">Bill To</div>
            <div style={{ fontWeight: 600 }}>{inv.client_name}</div>
            {inv.client_email && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{inv.client_email}</div>}
            {inv.client_address && <div style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'pre-line' }}>{inv.client_address}</div>}
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
          <div className="invoice-total-row">
            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
            <span>{fmt(inv.subtotal)}</span>
          </div>
          <div className="invoice-total-row">
            <span style={{ color: 'var(--text-muted)' }}>Tax ({inv.tax_rate}%)</span>
            <span>{fmt(inv.tax_amount)}</span>
          </div>
          <div className="invoice-total-row grand">
            <span>Total</span>
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
