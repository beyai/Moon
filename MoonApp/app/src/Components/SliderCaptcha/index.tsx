import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text,  Animated, LayoutChangeEvent, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';

import TrackCrypt from './TrackCrypt'; 
import { Icon } from '../Icon';
import { SliderCaptchaStyles as styles } from './styles'
import { useUnistyles } from 'react-native-unistyles';

interface SliderCaptchaProps {
    onRequest: ( trackCode: string ) => Promise<void>;
}

enum STATUS {
    READY = 1,
    PENDING = 2,
    CHECKING = 3,
    SUCCESS = 4,
    ERROR = 5
}

export const SliderCaptcha = React.memo(({ onRequest }: SliderCaptchaProps) => {
    const { theme } = useUnistyles()
    const [status, setStatus] = useState(STATUS.READY);
    styles.useVariants({ status })

    const [containerWidth, setContainerWidth] = useState(0);
    const [buttonWidth, setButtonWidth] = useState(0);

    const statusRef = useRef(STATUS.READY);
    const maxDragWidthRef = useRef(0);
    const trackRecord = useRef<number[][]>([]);
    const lastTime = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const translateX = useRef(new Animated.Value(0)).current;

    // 更新状态
    const updateStatus = (newStatus: number) => {
        setStatus(newStatus);
        statusRef.current = newStatus;
    };

    useEffect(() => {
        if (containerWidth > 0 && buttonWidth > 0) {
            maxDragWidthRef.current = containerWidth - buttonWidth;
        }
    }, [containerWidth, buttonWidth]);

    const addTrack = (x: number, y: number) => {
        const now = Date.now();
        if (now - lastTime.current > 16) {
            trackRecord.current.push([Math.round(x), Math.round(y), now]);
            lastTime.current = now;
        }
    };

    const reset = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        updateStatus(STATUS.READY);
        trackRecord.current = [];
        lastTime.current = 0;

        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 8
        }).start();
    };

    const executeApiCheck = async () => {
        try {
            const tracks = TrackCrypt.encrypt(trackRecord.current);
            await onRequest(tracks)
            updateStatus(STATUS.SUCCESS);
            timerRef.current = setTimeout(reset, 5000);
        } catch (err) {
            updateStatus(STATUS.ERROR);
            timerRef.current = setTimeout(reset, 1000);
        }
    };

    const panGesture = useMemo(() => Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-10, 10]) 
        .failOffsetY([-10, 10])
        .onBegin((e) => {
            if (statusRef.current === STATUS.READY) {
                translateX.stopAnimation();
                updateStatus(STATUS.PENDING);
                trackRecord.current = [];
                addTrack(e.absoluteX, e.absoluteY);
            }
        })
        .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
            if (statusRef.current !== STATUS.PENDING) return;
            const maxDrag = maxDragWidthRef.current || 0;
            let dx = e.translationX;
            if (dx < 0) dx = 0;
            if (dx > maxDrag) dx = maxDrag;
            translateX.setValue(dx);
            addTrack(e.absoluteX, e.absoluteY);
        })
        .onEnd((e) => {
            if (statusRef.current !== STATUS.PENDING) return;
            addTrack(e.absoluteX, e.absoluteY);
            const maxDrag = maxDragWidthRef.current || 0;
            if (e.translationX >= (maxDrag - 5) && trackRecord.current.length > 2) {
                updateStatus(STATUS.CHECKING);
                Animated.timing(translateX, {
                    toValue: maxDrag,
                    duration: 100,
                    useNativeDriver: false
                }).start(() => {
                    executeApiCheck();
                });
            } else {
                reset();
            }
        })
        .onFinalize(() => {
            if (statusRef.current === STATUS.PENDING) {
                reset();
            }
        }),
    []);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const isChecking = status === STATUS.CHECKING;
    const isSuccess = status === STATUS.SUCCESS;
    const isError = status === STATUS.ERROR;
    const isReady = status === STATUS.READY;

    const renderIcon = () => {
        if (isChecking) return <ActivityIndicator size="small" color={ theme.colorPrimary } />;
        if (isSuccess) return <Icon name='check-circle-fill' style={ styles.icon } />;
        if (isError) return <Icon name='close-circle-fill' style={ styles.icon } />;
        return <Icon name='right' style={ styles.icon } />;
    };

    return (
        <View
            style={ styles.container }
            onLayout={(e: LayoutChangeEvent) => {
                const { width } = e.nativeEvent.layout;
                setContainerWidth(width);
            }}
        >
            <Animated.View
                style={[
                    styles.mask,
                    {
                        width: translateX.interpolate({ 
                            inputRange: [0, Math.max(1, maxDragWidthRef.current)],
                            outputRange: [0, containerWidth], 
                            extrapolate: 'clamp' 
                        }),
                    }
                ]}
            />

            <View style={styles.tipsContainer}>
                <Text style={ styles.tipsText }>
                    { isChecking && "验证中..." }
                    { isSuccess && "验证成功" }
                    { isError && "验证失败" }
                    { (!isChecking && !isSuccess && !isError) && "请按住滑块，拖动到最右边" }
                </Text>
            </View>

            <GestureDetector 
                gesture={panGesture} 
                userSelect={isReady || status === STATUS.PENDING ? 'auto' : 'none'}
            >
                <Animated.View
                    style={[ styles.btn, { transform: [{ translateX }] } ]}
                    onLayout={(e: LayoutChangeEvent) => {
                        const { width } = e.nativeEvent.layout;
                        setButtonWidth(width);
                    }}
                >
                    {renderIcon()}
                </Animated.View>
            </GestureDetector>
        </View>
    );
})