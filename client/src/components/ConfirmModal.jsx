export default function ConfirmModal({ message, warning, onConfirm, onCancel, confirmLabel = 'Delete', confirmClassName = 'btn btn-danger' }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        {warning && (
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 6, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#92400e', fontWeight: 500 }}>
            ⚠️ {warning}
          </div>
        )}
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={confirmClassName} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
