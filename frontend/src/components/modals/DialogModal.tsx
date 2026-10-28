import React, { useEffect, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Button } from '../common/Button';

export const DialogModal: React.FC = () => {
  const { modal, closeModal } = useWorkspace();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (modal.open && !dialog.open) {
      dialog.showModal();
    } else if (!modal.open && dialog.open) {
      dialog.close();
    }
  }, [modal.open]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        closeModal();
      }
    }
  };

  return (
    <dialog
      id="dialog"
      ref={dialogRef}
      onClick={handleBackdropClick}
      onClose={closeModal}
    >
      {modal.open && (
        <>
          <h2>{modal.title}</h2>
          {modal.content}
          <div className="actions">
            <Button onClick={closeModal}>Close</Button>
            {modal.actions}
          </div>
        </>
      )}
    </dialog>
  );
};
