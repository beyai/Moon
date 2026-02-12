import { useMemo, useRef, useState } from 'react';
import { View, Text, ListRenderItemInfo, FlatListComponent } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import ActionSheet, { useSheetPayload, useSheetRef, FlatList } from "react-native-actions-sheet"
import styles from './PageStyles';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Check } from '../Check';

export interface ActionSheetPageItem<ItemT> {
    label: string;
    desc?: string;
    value: ItemT,
    [key: string]: any
}

export interface ActionSheetPagePayload<ItemT> {
    title: string;
    value: ItemT;
    data: ActionSheetPageItem<ItemT>[];
    containerHeight?: number;
    itemHeight?: number;
    onCancel?: () => void;
    onConfirm?: (value: ItemT) => void;
    onChange?: (item: ActionSheetPageItem<ItemT>) => void;
}

export function ActionSheetPageView() {
    const sheetRef = useSheetRef<"page">()
    const { 
        title, 
        value, 
        data, 
        containerHeight = 500,
        itemHeight = 56,
        onCancel,
        onConfirm,
        onChange
    }: ActionSheetPagePayload<any> = useSheetPayload()

    
    const listRef = useRef<any>(null)
    const [ currentValue, setCurrentValue ] = useState(value)

    const initIndex = useMemo(() => {
        return data.findIndex((item) => {
            return item.value === value
        })
        return 0
    }, [])

    // 取消
    function handlerCancel() {
        sheetRef.current.hide()
        onCancel?.()
    }

    // 确定
    function handlerConfirm() {
        sheetRef.current.hide()
        onConfirm?.(currentValue)
    }

    // 修改
    function handlerChange(item: ActionSheetPageItem<any> ) {
        setCurrentValue(item.value)
        onChange?.(item)
    }

    function RenderItem({ item, index }: ListRenderItemInfo<ActionSheetPageItem<any>>) {
        const hasBorder = index < ( data.length - 1)
        const isActive = item.value === currentValue
        return (
            <RectButton
                activeOpacity={ isActive ? 0 : 0.1 }
                style={ styles.item }
                onPress={() => {
                    !isActive && handlerChange(item)
                }}
            >
                <View style={ [styles.itemWrapper(itemHeight),  hasBorder && styles.border ] }>
                    <Check
                        value={ currentValue }
                        checkedValue={ item.value }
                    />
                    <Text style={ styles.itemLabel }>{ item.label }</Text>
                    <Text style={ styles.itemDesc }>{ item.desc }</Text>
                </View>
            </RectButton>
        )
    }

    return (
        <ActionSheet
            backgroundInteractionEnabled={ false }
            containerStyle={ styles.wrapper }
            gestureEnabled={ false }
            closeOnTouchBackdrop={ true }
            elevation={ 20 }
        >
            <View style={ [ styles.header, styles.border ] }>
                <Button size='small' text='取消' type='text' status='error'  onClick={ handlerCancel  } />
                <Text style={ styles.titleText }>{ title } </Text>
                <Button size='small' type='text' text='确定' onClick={ handlerConfirm } />
            </View>
            <View
                style={ styles.body(containerHeight) }
            >
                <FlatList
                    ref={ listRef }
                    data={ data }
                    keyExtractor={ (_, index ) => index.toString() }
                    renderItem={ RenderItem }
                    windowSize={ 10 }
                    initialScrollIndex={ initIndex }
                    getItemLayout= { (_, index) => {
                        return {
                            index,
                            length: itemHeight,
                            offset: itemHeight * index,
                        }
                    }}
                />
            </View>
        </ActionSheet>
    )
}