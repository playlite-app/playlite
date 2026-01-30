import './modal.css';

import { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children }: Props) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        {children}
        <button className="close" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
