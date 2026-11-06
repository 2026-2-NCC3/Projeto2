import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
const TOAST_DURATION_MS = 4000;
const ToastContext = createContext({ toast: () => { } });
export function useToast() {
    return useContext(ToastContext);
}
const ICONS = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};
const STYLES = {
    success: 'bg-white border-green-200 text-green-800',
    error: 'bg-white border-red-200 text-red-800',
    warning: 'bg-white border-amber-200 text-amber-800',
    info: 'bg-white border-blue-200 text-blue-800',
};
const ICON_STYLES = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
};
function ToastItem({ toast, onDismiss }) {
    const Icon = ICONS[toast.type];
    useEffect(() => {
        const dismissTimer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);
        return () => clearTimeout(dismissTimer);
    }, [toast.id, onDismiss]);
    return (<div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full ${STYLES[toast.type]} animate-[fadeSlideIn_0.2s_ease-out]`}>
      <Icon size={16} className={`flex-shrink-0 mt-0.5 ${ICON_STYLES[toast.type]}`}/>
      <span className="flex-1 text-sm">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
        <X size={14}/>
      </button>
    </div>);
}
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(currentToast => currentToast.id !== id));
    }, []);
    const toast = useCallback((message, type = 'success') => {
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);
    }, []);
    return (<ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
        {toasts.map(currentToast => (<ToastItem key={currentToast.id} toast={currentToast} onDismiss={dismiss}/>))}
      </div>
    </ToastContext.Provider>);
}
