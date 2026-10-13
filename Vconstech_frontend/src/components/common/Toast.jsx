import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const toastDurations = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
};

const toastListeners = new Set();

export const showToast = (message, type = 'info') => {
  const toast = {
    id: `${Date.now()}-${Math.random()}`,
    message,
    type,
    duration: toastDurations[type] || toastDurations.info,
  };

  toastListeners.forEach((listener) => listener(toast));
};

export const showSuccessMessage = (message) => showToast(message, 'success');
export const showErrorMessage = (message) => showToast(message, 'error');
export const showWarningMessage = (message) => showToast(message, 'warning');
export const showInfoMessage = (message) => showToast(message, 'info');

const Toast = ({ message, type = 'info', onClose, duration }) => {
  const autoCloseDuration = duration ?? toastDurations[type] ?? toastDurations.info;

  useEffect(() => {
    if (autoCloseDuration) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [autoCloseDuration, onClose]);

  const types = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      iconColor: 'text-green-500',
      textColor: 'text-green-800',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      iconColor: 'text-red-500',
      textColor: 'text-red-800',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-800',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-800',
    },
  };

  const config = types[type] || types.info;
  const Icon = config.icon;

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border-l-4 rounded-lg shadow-lg p-4 w-full max-w-md flex items-start gap-3 animate-slide-in`}
    >
      <Icon className={`${config.iconColor} w-5 h-5 flex-shrink-0 mt-0.5`} />
      <p className={`${config.textColor} text-sm font-medium flex-1`}>
        {message}
      </p>
      <button
        onClick={onClose}
        className={`${config.iconColor} hover:opacity-70 transition-opacity`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const [toasts, setToasts] = React.useState([]);

  useEffect(() => {
    const addToast = (toast) => {
      setToasts((currentToasts) => [...currentToasts, toast]);
    };

    toastListeners.add(addToast);
    return () => toastListeners.delete(addToast);
  }, []);

  const removeToast = (id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex w-[calc(100%-2rem)] max-w-md flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;
