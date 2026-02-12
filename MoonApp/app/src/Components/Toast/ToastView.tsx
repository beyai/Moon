import React, { useImperativeHandle, useRef, useState, forwardRef, useCallback, useEffect } from "react";
import { ActivityIndicator, Animated, Modal, Text, View } from "react-native";
import { Icon } from "../Icon"; 
import { ToastStyles } from "./styles";

export interface ToastOptions {
    message: string;
    icon?: string;
    showIcon?: boolean;
    duration?: number;
    autoHide?: boolean;
}

export interface ToastRef {
    show: (options: ToastOptions) => void;
    hide: () => void;
}

// 默认配置
const DEFAULT_OPTIONS: Required<ToastOptions> = {
    message: '',
    icon: 'exclamation-circle-fill',
    showIcon: false,
    duration: 2000,
    autoHide: true,
};

export const ToastView = forwardRef<ToastRef, {}>((_, ref) => {
    
    const [isVisible, setIsVisible] = useState(false);
    const [config, setConfig] = useState<Required<ToastOptions>>(DEFAULT_OPTIONS);
    
    // 动画值与定时器
    const opacity = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 清理定时器
    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => clearTimer();
    }, [clearTimer]);

    const hide = useCallback(() => {
        clearTimer();
        setIsVisible(false);
    }, [clearTimer, opacity]);

    // 显示逻辑
    const show = useCallback((opts: ToastOptions) => {
        clearTimer();
        const newConfig = { ...DEFAULT_OPTIONS, ...opts };
        setConfig(newConfig);
        setIsVisible(true);
        // 设置自动隐藏
        if (newConfig.autoHide) {
            timerRef.current = setTimeout(hide, newConfig.duration);
        }
    }, [clearTimer, hide, opacity]);

    useImperativeHandle(ref, () => ({ show, hide }));

    if (!isVisible) return null;

    return (
        <Modal
            visible={ isVisible }
            transparent={ true }
            animationType="fade"
            onRequestClose={ hide }
        >
            <View style={ToastStyles.container}>
                <View style={ ToastStyles.toastContainer }>
                    {config.showIcon && (
                        config.icon === 'loading' ? (
                            <ActivityIndicator size="large" color="white" style={ToastStyles.icon} />
                        ) : (
                            <Icon name={config.icon} color="white" style={ToastStyles.icon} />
                        )
                    )}
                    {!!config.message && (
                        <Text style={ToastStyles.message}>{config.message}</Text>
                    )}
                </View>
            </View>
        </Modal>
    );
});