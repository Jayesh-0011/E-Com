import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, toast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message, duration) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const info = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-20 left-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'from-emerald-600/90 to-green-600/90',
          border: 'border-emerald-500/50',
          icon: '✓',
          iconBg: 'bg-emerald-500',
          text: 'text-emerald-100'
        };
      case 'error':
        return {
          bg: 'from-red-600/90 to-rose-600/90',
          border: 'border-red-500/50',
          icon: '✕',
          iconBg: 'bg-red-500',
          text: 'text-red-100'
        };
      case 'warning':
        return {
          bg: 'from-amber-600/90 to-yellow-600/90',
          border: 'border-amber-500/50',
          icon: '⚠',
          iconBg: 'bg-amber-500',
          text: 'text-amber-100'
        };
      default:
        return {
          bg: 'from-blue-600/90 to-cyan-600/90',
          border: 'border-blue-500/50',
          icon: 'ℹ',
          iconBg: 'bg-blue-500',
          text: 'text-blue-100'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`
        relative min-w-[320px] max-w-md
        bg-gradient-to-r ${styles.bg}
        backdrop-blur-xl
        border ${styles.border}
        rounded-xl shadow-2xl
        p-4 pr-10
        pointer-events-auto
        transform transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 -translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'}
        animate-slideInLeft
      `}
      style={{
        animation: isExiting ? 'none' : 'slideInLeft 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }}
    >
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
      
      {/* Icon */}
      <div className="flex items-start gap-3">
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full
          ${styles.iconBg}
          flex items-center justify-center
          text-white font-bold text-sm
          shadow-lg
          animate-pulse
        `}>
          {styles.icon}
        </div>
        
        {/* Message */}
        <div className="flex-1">
          <p className={`${styles.text} font-medium text-sm leading-relaxed`}>
            {toast.message}
          </p>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={handleRemove}
        className={`
          absolute top-2 right-2
          w-6 h-6 rounded-full
          ${styles.text} hover:bg-white/20
          flex items-center justify-center
          transition-all duration-200
          hover:scale-110 active:scale-95
          opacity-70 hover:opacity-100
        `}
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-xl overflow-hidden">
        <div
          className={`h-full ${styles.iconBg} animate-progress`}
          style={{
            animation: `progress ${toast.duration}ms linear forwards`
          }}
        />
      </div>

      <style>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};






