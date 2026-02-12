import React, { createContext, ReactNode, useContext, useMemo, useRef } from "react";
import { ToastOptions, ToastRef, ToastView } from "./ToastView";

export interface ToastContextType {
    show: (message: string, options?: Partial<ToastOptions>) => void;
    info: (message: string, options?: Partial<ToastOptions>) => void;
    success: (message: string, options?: Partial<ToastOptions>) => void;
    error: (message: string, options?: Partial<ToastOptions>) => void;
    loading: (message?: string, options?: Partial<ToastOptions>) => void;
    hide: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const toastRef = useRef<ToastRef>(null);

    const open = (message: string, options: Partial<ToastOptions> = {}, preset: Partial<ToastOptions> = {}) => {
        if (toastRef.current) {
            toastRef.current.show({
                ...preset, 
                ...options,
                message,
            } as ToastOptions);
        }
    };

    const contextValue = useMemo<ToastContextType>(() => ({
        // 普通显示
        show: (message, options) => 
            open(message, options, { autoHide: true, showIcon: false }),

        // 信息
        info: (message, options) => 
            open(message, options, { icon: 'error-circle', showIcon: true, autoHide: true }),

        // 成功
        success: (message, options) => 
            open(message, options, { icon: 'check-circle', showIcon: true, autoHide: true }),

        // 错误
        error: (message, options) => 
            open(message, options, { icon: 'close-circle', showIcon: true, autoHide: true }),

        // 加载中 (默认不自动隐藏)
        loading: (message = '加载中', options) => 
            open(message, options, { icon: 'loading', showIcon: true, autoHide: false }),

        // 隐藏
        hide: () => toastRef.current?.hide(),
    }), []);

    return (
        <ToastContext.Provider value={contextValue}>
            { children }
            <ToastView ref={toastRef} />
        </ToastContext.Provider>
    );
};

export function useToast(): ToastContextType {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}