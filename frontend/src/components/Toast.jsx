import React from 'react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slm-ink text-slm-paper px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold z-[300] transition-all duration-300 transform translate-y-0 opacity-100 flex items-center gap-2"
    >
      <span>{message}</span>
    </div>
  );
}
