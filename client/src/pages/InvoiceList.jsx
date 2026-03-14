import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../apiFetch';
import ConfirmModal from '../components/ConfirmModal';

function fmt(amount) {
  return '$' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_TOOLTIPS = {
  paid: 'Payment received',
  unpaid: 'Payment not yet received',
  overdue: 'Past due date — payment not received',
};

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`} data-tooltip={STATUS_TOOLTIPS[status]}>{status}</span>;
}

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [confirmId, setConfirmId] = useState(null);
  const [markPaidId, setMarkPaidId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/api/invoices').then(r => r.json()).then(setInvoices);
    apiFetch('/api/clients').then(r => r.json()).then(setClients);
  }, []);

  async function handleDelete() {
    await apiFetch(`/api/invoices/${confirmId}`, { method: 'DELETE' });
    setInvoices(prev => prev.filter(inv => inv.id !== confirmId));
    setConfirmId(null);
  }

  async function handleMarkPaid() {
    const inv = invoices.find(i => i.id === markPaidId);
    const res = await apiFetch(`/api/invoices/${markPaidId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...inv, status: 'paid' }),
    });
    const updated = await res.json();
    setInvoices(prev => prev.map(i => i.id === markPaidId ? updated : i));
    setMarkPaidId(null);
  }

  const totalInvoiced = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const paid = invoices.filter(i => i.status === 'paid');
  const unpaid = invoices.filter(i => i.status === 'unpaid');
  const overdue = invoices.filter(i => i.status === 'overdue');

  return (
    <>
    <main className="page">
      <div className="page-header">
        <h1>Rental Invoices</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/tenants/new" className="btn btn-secondary" data-tooltip="Create a new tenant">+ Add Tenant</Link>
          <Link to="/invoices/new" className="btn btn-primary" data-tooltip="Create a new invoice">+ New Invoice</Link>
        </div>
      </div>

      <div className="summary-cards" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="summary-card">
          <div className="label">Tenants</div>
          <div className="value">{clients.length}</div>
          <div className="sub">registered tenant{clients.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="summary-card">
          <div className="label">Total Invoiced</div>
          <div className="value">{fmt(totalInvoiced)}</div>
          <div className="sub">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="summary-card">
          <div className="label">Paid</div>
          <div className="value" style={{ color: 'var(--success)' }}>{fmt(paid.reduce((s, i) => s + i.total, 0))}</div>
          <div className="sub">{paid.length} invoice{paid.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="summary-card">
          <div className="label">Unpaid</div>
          <div className="value" style={{ color: 'var(--warning)' }}>{fmt(unpaid.reduce((s, i) => s + i.total, 0))}</div>
          <div className="sub">{unpaid.length} invoice{unpaid.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="summary-card">
          <div className="label">Overdue</div>
          <div className="value" style={{ color: 'var(--danger)' }}>{fmt(overdue.reduce((s, i) => s + i.total, 0))}</div>
          <div className="sub">{overdue.length} invoice{overdue.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {invoices.length === 0 ? (
            <div className="empty-state">
              <p>No rental invoices yet.</p>
              <Link to="/invoices/new" className="btn btn-primary mt-16" style={{ marginTop: 12 }}>Create your first invoice</Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Tenant</th>
                  <th>Invoice Date</th>
                  <th>Payment Due</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td><Link to={`/invoices/${inv.id}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>{inv.invoice_number}</Link></td>
                    <td>{inv.client_name}</td>
                    <td>{inv.date_created}</td>
                    <td>{inv.due_date}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td className="text-right" style={{ fontWeight: 500 }}>{fmt(inv.total)}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-ghost btn-sm" data-tooltip="View invoice details" onClick={() => navigate(`/invoices/${inv.id}`)}>View</button>
                        <button className="btn btn-ghost btn-sm" data-tooltip="Edit this invoice" onClick={() => navigate(`/invoices/${inv.id}/edit`)}>Edit</button>
                        {inv.status !== 'paid' && (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--success)' }} data-tooltip="Mark this invoice as paid" onClick={() => setMarkPaidId(inv.id)}>Mark Paid</button>
                        )}
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} data-tooltip="Permanently delete this invoice" onClick={() => setConfirmId(inv.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>

    {confirmId && (() => {
      const inv = invoices.find(i => i.id === confirmId);
      const outstanding = inv && (inv.status === 'unpaid' || inv.status === 'overdue');
      return (
        <ConfirmModal
          warning={outstanding ? `This invoice is ${inv.status} and may have already been sent to the tenant.` : undefined}
          message="Delete this invoice? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      );
    })()}
    {markPaidId && (
      <ConfirmModal
        message="Mark this invoice as paid?"
        confirmLabel="Mark Paid"
        confirmClassName="btn btn-primary"
        onConfirm={handleMarkPaid}
        onCancel={() => setMarkPaidId(null)}
      />
    )}
    </>
  );
}
