import { createContext, useContext, useState, useCallback } from 'react';
import { MdDelete, MdWarning, MdInfo, MdClose, MdRefresh, MdRemoveShoppingCart } from 'react-icons/md';

const ConfirmContext = createContext(null);

const TYPES = {
  danger:  { color: '#ef4444', bg: 'rgba(239,68,68,.1)',  border: 'rgba(239,68,68,.22)', Icon: MdDelete   },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.22)', Icon: MdWarning  },
  return:  { color: '#8b5cf6', bg: 'rgba(139,92,246,.1)', border: 'rgba(139,92,246,.22)', Icon: MdRefresh  },
  cart:    { color: '#f59e0b', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.22)', Icon: MdRemoveShoppingCart },
  info:    { color: '#06b6d4', bg: 'rgba(6,182,212,.1)',  border: 'rgba(6,182,212,.22)', Icon: MdInfo     },
};

function ConfirmDialog({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', onConfirm, onCancel }) {
  const cfg = TYPES[type] || TYPES.danger;
  const { Icon, color, bg, border } = cfg;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          width: 360,
          padding: '2rem 1.75rem 1.5rem',
          boxShadow: `0 32px 80px rgba(0,0,0,.5), 0 0 0 1px ${border}`,
          animation: 'confirm-pop .22s cubic-bezier(.34,1.56,.64,1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: '.6rem',
          position: 'relative',
        }}
      >
        {/* Close × */}
        <button
          onClick={onCancel}
          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, borderRadius: 6, display: 'flex' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.07)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-faint)'; }}
        >
          <MdClose style={{ fontSize: 16 }} />
        </button>

        {/* Icon ring */}
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: bg, border: `2px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '.15rem',
        }}>
          <Icon style={{ fontSize: 30, color }} />
        </div>

        {/* Title */}
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3 }}>
          {title}
        </div>

        {/* Message */}
        {message && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 270 }}>
            {message}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '.6rem', marginTop: '.65rem', width: '100%' }}>
          <button
            onClick={onCancel}
            className="btn btn-ghost"
            style={{ flex: 1, justifyContent: 'center', padding: '.62rem', fontSize: 13 }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1.4, padding: '.62rem', borderRadius: 9,
              background: color, color: '#fff', border: 'none',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: `0 2px 14px ${color}45`,
              transition: 'opacity .15s, transform .1s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirm-pop {
          from { opacity: 0; transform: scale(.86) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((options) =>
    new Promise(resolve => setDialog({ ...options, resolve }))
  , []);

  const handleConfirm = () => { dialog?.resolve(true);  setDialog(null); };
  const handleCancel  = () => { dialog?.resolve(false); setDialog(null); };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && <ConfirmDialog {...dialog} onConfirm={handleConfirm} onCancel={handleCancel} />}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
