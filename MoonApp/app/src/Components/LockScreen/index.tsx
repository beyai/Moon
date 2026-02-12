import { useEffect, useRef, memo, useState } from "react";
import { View, StatusBar, ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Tool } from "react-native-nitro-moon";
import styles from './styles'

interface LockScreenProps extends ViewProps {
    onChangeLockScreen?: (state: boolean) => void
}

function LockScreen({
    children,
    onChangeLockScreen,
    ...props
}: LockScreenProps) {
    const [ isLock, setIsLock ] = useState(false)

    // 保持屏幕常亮
    useEffect(() => {
        Tool.setIdleTimeDisabled(true)
        return () => Tool.setIdleTimeDisabled(false)
    }, [])

    // 监听状态，切换亮度
    useEffect(() => {
        if (isLock) {
            Tool.setBrightness(0)
            StatusBar.setHidden(true, 'slide')
        } else {
            Tool.restoreBrightness()
            StatusBar.setHidden(false, 'slide')
        }
        onChangeLockScreen?.(isLock)
    }, [ isLock ])

    // 初始化与恢复
    useEffect(() => {
        return () => {
            StatusBar.setHidden(false, 'slide')
            Tool.restoreBrightness()
        }
    }, [])

    // 触摸
    const pan = Gesture.Pan()
    const countRef = useRef(0)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    pan.onTouchesDown(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }).onEnd((event) => {
        const { translationY } = event;
        const direction = translationY < -50 ? 'up' : translationY > 50 ? 'down' : null;
        if (!direction) return;
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        if ((isLock && direction === 'up') || (!isLock && direction === 'down')) {
            countRef.current++;
            if (countRef.current >= 5) {
                setIsLock(!isLock)
                countRef.current = 0;
            }
        } else {
            countRef.current = 0;
        }
        timerRef.current = setTimeout(() => {
            countRef.current = 0;
        }, 500);
    }).runOnJS(true)


    // 监听状态变化
    return (
        <GestureDetector gesture={ pan }>
            <View { ...props }>
                { children }
                { isLock && (<View style={ styles.Mask } />) }
            </View>
        </GestureDetector>
    )
}

export default memo(LockScreen)