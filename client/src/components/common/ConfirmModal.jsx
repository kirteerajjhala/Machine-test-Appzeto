export default function ConfirmModal({ modal, onCancel }) {
  if (!modal) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !modal.loading) onCancel();
      }}
    >
      <section
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <span className="modal-mark">!</span>
        <h2 id="confirm-title">{modal.title}</h2>
        <p>{modal.message}</p>
        <div className="modal-actions">
          <button
            className="secondary"
            disabled={modal.loading}
            onClick={onCancel}
          >
            {modal.cancelText || "Cancel"}
          </button>
          <button
            className="danger"
            disabled={modal.loading}
            onClick={modal.onConfirm}
          >
            {modal.loading
              ? `${modal.confirmText || "Confirm"}...`
              : modal.confirmText || "Confirm"}
          </button>
        </div>
      </section>
    </div>
  );
}
