import { useEffect, useId, useRef } from 'react';

/** Small confirmation modal. Render it only while it should be visible. */
export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog.open) dialog.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      // Keep Esc from also closing the bag drawer behind this dialog
      onKeyDown={(e) => e.key === 'Escape' && e.stopPropagation()}
      onClick={(e) => e.target === ref.current && onCancel()}
    >
      <h2 id={titleId} className="confirm-title">{title}</h2>
      <p className="muted confirm-message">{message}</p>
      <div className="confirm-actions">
        <button type="button" className="btn btn-outline btn-small" onClick={onCancel} autoFocus>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-small" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
