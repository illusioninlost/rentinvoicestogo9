import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../apiFetch';

function fmt(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function Reports() {
  const [filters, setFilters] = useState({ startDate: '', endDate: '', client: '', status: '' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }));
  }

  async function applyFilters(e) {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate)   params.set('endDate', filters.endDate);
    if (filters.client)    params.set('client', filters.client);
    if (filters.status)    params.set('status', filters.status);
    const res = await apiFetch(`/api/reports?${params.toString()}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }

  async function clearFilters() {
    setFilters({ startDate: '', endDate: '', client: '', status: '' });
    setResults(null);
  }

  function exportCSV() {
    const headers = ['Invoice #', 'Tenant', 'Email', 'Property', 'Invoice Date', 'Payment Due', 'Status', 'Total', 'Notes'];
    const rows = results.map(inv => [
      inv.invoice_number,
      inv.client_name,
      inv.client_email || '',
      inv.property_address || '',
      inv.date_created,
      inv.due_date,
      inv.status,
      inv.total,
      inv.notes || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredTotal = results ? results.reduce((s, i) => s + (i.total || 0), 0) : 0;

  return (
    <main className="page">
      <div className="page-header">
        <h1>Reports</h1>
      </div>

      <form onSubmit={applyFilters}>
        <div className="filters-bar">
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" value={filters.endDate} onChange={e => setFilter('endDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Tenant Name</label>
            <input type="text" value={filters.client} onChange={e => setFilter('client', e.target.value)} placeholder="Search tenant…" />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={filters.status} onChange={e => setFilter('status', e.target.value)}>
              <option value="">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Searching…' : 'Apply Filters'}</button>
            {results !== null && <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear</button>}
          </div>
        </div>
      </form>

      {results !== null && results.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 12, marginBottom: 16 }}>
          <button className="btn btn-secondary" onClick={exportCSV}>Export to CSV</button>
        </div>
      )}

      {results === null ? (
        <div className="empty-state">
          <p className="text-muted">Set filters above and click Apply Filters to see results.</p>
        </div>
      ) : (
        <>
          {results.length === 0 ? (
            <div className="empty-state">
              <p>No invoices match your filters.</p>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Tenant</th>
                      <th>Invoice Date</th>
                      <th>Payment Due</th>
                      <th>Status</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(inv => (
                      <tr key={inv.id}>
                        <td><Link to={`/invoices/${inv.id}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>{inv.invoice_number}</Link></td>
                        <td>{inv.client_name}</td>
                        <td>{inv.date_created}</td>
                        <td>{inv.due_date}</td>
                        <td><StatusBadge status={inv.status} /></td>
                        <td className="text-right" style={{ fontWeight: 500 }}>{fmt(inv.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '14px 20px', marginTop: 16, display: 'flex', gap: 32 }}>
            <span className="text-muted">Results: <strong style={{ color: 'var(--text)' }}>{results.length}</strong></span>
            <span className="text-muted">Total: <strong style={{ color: 'var(--text)' }}>{fmt(filteredTotal)}</strong></span>
          </div>
        </>
      )}
    </main>
  );
}
