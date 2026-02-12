import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { RectButton } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, TTS } from 'react-native-nitro-moon';
import { Icon } from '@/Components/Icon';
import { RulerView } from '@/Components/Ruler';
import LockScreen from '@/Components/LockScreen';
import FpsGraph from '@/Components/FpsGraph'
import { DeviceActions, useDeviceStore } from '@/Store';

import { PlayDataState, usePlayStore } from '@/Detecter/PlayStore';
import { useDetection } from '@/Hooks';
import { RTCProvider } from '@/RTC/RTCContext';
import { useRtcStore } from '@/RTC/RTCStore';
import styles from './styles';

enum TabType {
    exposure = 'exposure',
    focus = 'focus',
    zoom = 'zoom',
}

const TabMap = [
    { label: '曝光', value: TabType.exposure },
    { label: '焦距', value: TabType.focus },
    { label: '放大', value: TabType.zoom },
]

const SettingMap = {
    [TabType.exposure]  : { gutter: 12, min: 0, max: 1, step: 0.02, precision: 2, subTicks: 5 },
    [TabType.focus]     : { gutter: 12, min: 0, max: 1, step: 0.02, precision: 2, subTicks: 5 },
    [TabType.zoom]      : { gutter: 12, min: 1, max: 3, step: 0.05, precision: 2, subTicks: 5 },
}

interface TabItemViewProps {
    label: string;
    value: TabType;
    active: boolean,
    border?: boolean,
    onClick: (value: TabType) => void
}

// 相机调节导航
function TabItemView({
    label,
    value,
    active = false,
    border = true,
    onClick
}: TabItemViewProps) {
    styles.useVariants({
        border,
        active,
    })
    return (
        <RectButton style={ styles.rulerTabItem } activeOpacity={ 0 } onPress={ () => onClick?.(value) } >
            <Text style={ styles.rulerTabLabel }>{ label }</Text>
        </RectButton>
    )
}

// 相机调节
function SettingView() {
    const { zoom, exposure, focus } = useDeviceStore();
    // 当前选择
    const [ currentType, setCurrentType ] = useState<TabType>(TabType.exposure)
    
    // 当前设置
    const setting = useMemo(() => SettingMap[currentType], [ currentType ])

    // 当前值
    const currentValue = useMemo(() => {
        switch(currentType) {
            case TabType.exposure:
                return exposure;
            case TabType.focus:
                return focus;
            case TabType.zoom:
                return zoom;
        }
    }, [ currentType, exposure, focus, zoom ])

    // 更新值
    function onChangeValue(value: number) {
        switch(currentType) {
            case TabType.exposure:
                return DeviceActions.setCamera('exposure', value);
            case TabType.focus:
                return DeviceActions.setCamera('focus', value);
            case TabType.zoom:
                return DeviceActions.setCamera('zoom', value);
        }
    }

    return (
        <View style={styles.ruler}>
            <View style={ styles.rulerContainer }>
                <Animated.View 
                    key={ currentType }
                    style={ styles.rulerContainer }
                    entering={ FadeInDown.duration(300) }
                    exiting={ FadeOutDown.duration(300) }
                >
                    <RulerView {...setting} value={ currentValue } onChangeValue={ onChangeValue }  />
                </Animated.View>
            </View>
            
            <View style={ styles.rulerTab }>
                {
                    TabMap.map(({ label, value }, index) => {
                        return (
                            <TabItemView
                                key={ index }
                                label={ label } 
                                value={ value } 
                                border={ index > 0 } 
                                active={ currentType === value } 
                                onClick={ setCurrentType } 
                            />
                        )
                    })
                }
            </View>
        </View>
    )
}


// 主界面
type LiveRootProps = {
    navigation: NativeStackNavigationProp<ParamListBase>;
}

function LiveRoot({ navigation }: LiveRootProps) {
    useDetection()

    const [ initialized, setInitialized ] = useState(false)
    const { zoom, exposure, focus, fps, brightness, orientation, deviceFilter, orientationText } = useDeviceStore();
    const { displayFps } = usePlayStore()

    // 切换相机语音播报
    useEffect(() => {
        if (!initialized) return;
        TTS.speak(orientationText)
    }, [  initialized, orientationText ])

    // 监听屏幕锁定：隐藏、显示导航栏
    const handlerChangeLock = useCallback((state: boolean) => {
        navigation.setOptions({ headerShown: !state })
    }, [])

    return (
        <LockScreen style={ styles.wrapper } onChangeLockScreen={ handlerChangeLock }>
            <CameraView
                style={ styles.camera }
                preview={ true }
                zoom={ zoom }
                focus={ focus }
                fps={ fps }
                exposure={ exposure }
                brightness={ brightness }
                filter={ deviceFilter }
                orientation={ orientation }
                onInitialized={ () => setInitialized(true) }
                onChangeDevice={(format) => {
                    // console.log(fps, format)
                }}
            />

            { displayFps && <FpsGraph style={ styles.fps } /> }

            <View style={ styles.container }>
                <SafeAreaView edges={['bottom']} style={ styles.footer }>
                    
                    <RectButton activeOpacity={ 0 } onPress={ () => navigation.navigate("Result") }>
                        <Icon type="image" name="Card" size={ 36 } />
                    </RectButton>

                    <RectButton activeOpacity={ 0 } onPress={ DeviceActions.filpCamera }>
                        <Icon type='image' name="Flip" size={ 72 } />
                    </RectButton>

                    <RectButton activeOpacity={ 0 } onPress={ DeviceActions.rotateOrientation }>
                        <Icon type='image' name="Phone" size={ 36 } style={ styles.orientation(orientation) } />
                    </RectButton>
                </SafeAreaView>
                {  initialized && <SettingView /> }
            </View>
        </LockScreen>
    )
}

// 联机状态
function OnlineState() {
    const { dataChannelState } = useRtcStore()
    const online = useMemo(() => {
        return dataChannelState == 'open'
    }, [ dataChannelState ])
    styles.useVariants({ online  })
    return (
        <View style={ styles.onlineState }>
            <View style={  styles.onlineStateDot }></View>
            <Text style={ styles.onlineStateText }>
                { online ? "已联机" : '未联机' }
            </Text>
        </View>
    )
}

function LivePage({ navigation }: NativeStackScreenProps<ParamListBase, "Live">) {
    const { deviceCode } = useDeviceStore();

    // 设置导航栏
    useLayoutEffect(() => {
        navigation.setOptions({
            title: PlayDataState.name,
            headerTitleStyle: { 
                color: 'white',
                // @ts-ignore
                textShadowColor: 'rgba(0,0,0,0.4)',
                textShadowOffset: { width: 1, height: 2 },
                textShadowRadius: 3,
            },

            headerLeft: () => {
                return (
                    <RectButton style={ styles.backBtn } activeOpacity={0} onPress={ navigation.goBack }>
                        <Icon name="arrow-left" style={ styles.backIcon } />
                    </RectButton>
                )
            },

            headerRight: () => {
                return (<OnlineState />)
            }
        })
    }, [])

    return (
        <RTCProvider deviceCode={ deviceCode }>
            <LiveRoot navigation={ navigation } />
        </RTCProvider>
    )
}



export default LivePage