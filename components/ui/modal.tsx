"use client";

import { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  bodyClassName?: string;
};

export function Modal({ open, title, onClose, children, panelClassName = "", bodyClassName = "" }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className={`w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-soft ${panelClassName}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            aria-label="Close modal"
          >
            Close
          </button>
        </div>
        <div className={`max-h-[75vh] overflow-y-auto p-4 ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
}
