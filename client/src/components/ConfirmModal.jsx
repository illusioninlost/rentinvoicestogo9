export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Delete', confirmClassName = 'btn btn-danger' }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={confirmClassName} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
