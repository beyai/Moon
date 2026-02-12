import { memo, ReactElement, ReactNode, useEffect, useRef } from "react";
import { ViewStyle } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

interface SwipeListProps<T> {
    data: T[];
    renderItem: (item: T, index: number) => ReactElement,
    style?: ViewStyle;
}

interface SwipeItemProps {
    style?: ViewStyle;
    containerStyle?: ViewStyle;
    children?: ReactNode;
    isActive?: boolean;
    renderActions?: (methods: SwipeableMethods) => ReactNode;
    onStartDrag?: () => void;
    onWillOpen?: () => void;
}

export const SwipeItem = memo(function SwipeItem({
    containerStyle, 
    style, 
    children, 
    isActive = false, 
    renderActions, 
    onStartDrag, 
    onWillOpen
}: SwipeItemProps) {

    const itemRef = useRef<SwipeableMethods | null>(null)
    
    useEffect(() => {
        if (!isActive && itemRef.current)  {
            itemRef.current.close()
        }
    }, [ isActive ])

    return (
        <ReanimatedSwipeable
            ref={ itemRef }
            friction={1}
            enabled={ !!renderActions }
            containerStyle={ containerStyle }
            childrenContainerStyle={ style }
            enableTrackpadTwoFingerGesture={ true  }
            overshootRight={ false }
            renderRightActions={ (progress, translation, methods) => {
                return renderActions?.(methods)
            }}
            onSwipeableOpenStartDrag = { onStartDrag }
            onSwipeableWillOpen = { onWillOpen }
        >
            { children }
        </ReanimatedSwipeable>
    )
})

export const SwipeList = memo(function SwipeList({
    data,
    renderItem,
    style = {}
}: SwipeListProps<any> ) {
    return (
        <FlatList
            style={ style }
            data={ data }
            renderItem={ ( info ) => {
                return renderItem(info.item, info.index)
            }}
            keyExtractor={(_, index) => String(index) }
        />
    )
})