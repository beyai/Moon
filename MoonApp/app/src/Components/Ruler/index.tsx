import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Dimensions, View, TextInput } from 'react-native'
import Animated, { 
    Extrapolation, SharedValue, interpolate, 
    useAnimatedStyle, useSharedValue, useAnimatedScrollHandler,
    useAnimatedProps,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets';
import { Haptics } from 'react-native-nitro-haptics'

import styles from './styles'

interface TickData {
    index: number;
    label: string;
    value: number;
    gutter: number;
    showValue: boolean;
}

interface RulerItemProps {
    index: number;
    scrollX: SharedValue<number>;
    item: TickData;
}

interface RulerViewProps {
    value: number;
    min?: number;
    max?: number;
    gutter?: number;
    step?: number;
    precision?: number;
    subTicks?: number;
    prefix?: string;
    sufix?: string;
    onChangeValue?: (value: number) => void;
}

interface RulerIndicatorProps extends Pick<RulerViewProps, 'min' | 'max' | 'gutter' | 'step' | 'precision' | 'prefix' | 'sufix'> {
    scrollX: SharedValue<number>;
}

const { width: screenWidth } = Dimensions.get("window")
const tickHeight = 16;
const AnimatedText = Animated.createAnimatedComponent(TextInput);

const RulerIndicator = React.memo(function RulerIndicator({ 
    scrollX, 
    min = 0,
    max = 10,
    gutter = 6,
    step = 0.1,
    precision = 2,
    prefix = '',
    sufix = "",
}:RulerIndicatorProps) {

    const animatedProps = useAnimatedProps(() => {
        const count = Math.round( (max - min) / step ) 
        let currentIndex = Math.round(scrollX.value / gutter);
        currentIndex = Math.max(0, Math.min(currentIndex, count));
        const val = min + currentIndex * step;
        const text = `${prefix}${val.toFixed(precision)}${sufix}`;
        return {  text: text, defaultValue: text }
    })
    
    return (
        <View style={ styles.Indicator }>
            <AnimatedText style={ styles.IndicatorText } editable={ false } animatedProps={ animatedProps } />
            <View style={ styles.IndicatorLine } />
            <View style={ styles.IndicatorRriangle } />
        </View>
    )
})

const RulerItem = React.memo(({ index, item, scrollX }: RulerItemProps) => {

    const animatedStyle = useAnimatedStyle(() => {
        const currentIndex = scrollX.value / item.gutter;
        const distance = Math.abs(index - currentIndex)
        return {
            opacity: interpolate( distance, [ 0, 15 ], [ 1, 0 ], Extrapolation.CLAMP ),
        }
    })

    const textStyle = useAnimatedStyle(() => {
        const currentIndex = scrollX.value / item.gutter;
        const distance = Math.abs(index - currentIndex);
        return {
            opacity: interpolate( distance, [0, 0.8], [0, 1], Extrapolation.CLAMP ),
        };
    });

    return (
        <Animated.View style={ [ styles.Tick, {  width: item.gutter }, animatedStyle ] }>
            { 
                item.showValue && (
                    <Animated.Text style={[ styles.TickValue, { bottom: tickHeight * 1.2 }, textStyle ]}>{ item.value }</Animated.Text> 
                )
            }
            <View style={[ styles.TickLine, {  height: item.showValue ? tickHeight : tickHeight / 2 } ]}/>
        </Animated.View>
    )
})

export const RulerView = React.memo(function RulerView({
    value,
    min = 0,
    max = 10,
    gutter = 6,
    step = 0.1,
    precision = 2,
    subTicks = 10,
    prefix = '',
    sufix = "",
    onChangeValue
}: RulerViewProps ) {

    const scrollX       = useSharedValue(0);
    const activeIndex   = useSharedValue(-1);
    const flatRef       = useRef<Animated.FlatList<TickData>>(null)
    const spaceWidth    = ( screenWidth - gutter ) / 2
    
    const isDragging = useRef(false);
    const isMomentum = useRef(false);

    const tickData = useMemo<TickData[]>(() => {
        const numSteps = Math.round( (max - min) / step ) 
        const items = []
        for (let i = 0; i <= numSteps; i++) {
            const val = Math.min(max, min + i * step)
            const itemValue = val.toFixed(precision)
            items.push({
                index: i,
                label: `${ prefix }${ itemValue }${ sufix }`,
                value: parseFloat(itemValue),
                gutter,
                showValue: i % subTicks === 0,
            })
        }
        return items
    }, [min, max, step, precision, subTicks, prefix, sufix, gutter])

    const initialIndex = useMemo(() => {
        const idx = Math.round((value - min) / step);
        return Math.max(0, Math.min(idx, tickData.length - 1));
    }, [ value, min, step, tickData.length ]);

    const triggerValueUpdate = (index: number) => {
        if (!isDragging.current && !isMomentum.current) return;
        if (!onChangeValue) return;
        const val = min + index * step;
        const finalValue = Number(val.toFixed(precision));
        onChangeValue(finalValue);
        Haptics.impact('medium')
    };

    const handlerScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x
            const index = Math.round(event.contentOffset.x / gutter);
            const clampedIndex = Math.max(0, Math.min(index, tickData.length - 1));
            
            if (clampedIndex === activeIndex.value) return;
            activeIndex.value = clampedIndex;
            scheduleOnRN(triggerValueUpdate, clampedIndex)
        }
    })

    useEffect(() => {
        if (isDragging.current || isMomentum.current) return;
        if (activeIndex.value === initialIndex) return;
        activeIndex.value = initialIndex;
        flatRef.current?.scrollToOffset({
            offset: initialIndex * gutter,
            animated: true 
        });
    }, [ initialIndex, gutter ])

    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
        return <RulerItem index={index} item={item} scrollX={ scrollX } />;
    },[]);

    return (
        <View style={ styles.Wrapper }>
            <RulerIndicator  
                scrollX={ scrollX } 
                min={ min } 
                max={ max } 
                step={ step } 
                precision={ precision } 
                gutter={ gutter } 
                prefix={ prefix } 
                sufix={ sufix } 
            />
            <Animated.FlatList
                ref={ flatRef } 
                style={ styles.Container }
                horizontal
                showsHorizontalScrollIndicator={ false }
                snapToInterval={ gutter }
                snapToAlignment='start'
                decelerationRate='fast'
                bounces={ true }

                data={ tickData }
                keyExtractor={ (item) => String(item.index) }
                renderItem={ renderItem }
                contentContainerStyle={{ paddingHorizontal: spaceWidth }}
                getItemLayout={ (_, index) => ({ length: gutter, offset: gutter * index, index }) }
                
                removeClippedSubviews={ true } 
                maxToRenderPerBatch={ 30 }

                onScroll={ handlerScroll }
                scrollEventThrottle={ 48 } 

                initialScrollIndex={ initialIndex }


                onScrollBeginDrag={() => {
                    isDragging.current = true;
                }}
                onScrollEndDrag={() => {
                    isDragging.current = false;
                }}
                onMomentumScrollBegin={() => {
                    isMomentum.current = true;
                }}
                onMomentumScrollEnd={() => {
                    isMomentum.current = false;
                }}
            />
        </View>
    )
})