import { View, Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import ActionSheet, { useSheetPayload, useSheetRef } from "react-native-actions-sheet"
import styles from './SheetStyles';

interface ActionSheetItem<ItemT> {
    label: string;
    value: ItemT,
}

export interface ActionSheetPayload<ItemT> {
    title?: string;
    value?: ItemT,
    data: ActionSheetItem<ItemT>[];
    onChange?: (value: ItemT) => void
}

export function ActionSheetView() {
    const sheetRef = useSheetRef<"sheet">()
    const { title, value, data, onChange }: ActionSheetPayload<any> = useSheetPayload()

    function handlerChange(item: ActionSheetItem<any>) {
        sheetRef.current.hide()
        onChange?.(item.value)
    }

    return (
        <ActionSheet
            backgroundInteractionEnabled={ false }
            containerStyle={ styles.wrapper }
            gestureEnabled={ false }
            closeOnTouchBackdrop={ true }
            useBottomSafeAreaPadding={ true }
            disableElevation
        >
            <View style={ styles.container }>
                {
                    title && (
                        <View style={ [ styles.title, styles.border ] }>
                            <Text style={ styles.titleText }>{ title }</Text>
                        </View>
                    )
                }
                {
                    data.map((item, index) => {
                        const hasBorder = index < ( data.length - 1)
                        const isActive = item.value === value
                        return (
                            <RectButton
                                key={ index }
                                activeOpacity={ isActive ? 0 : 0.1 }
                                style={[
                                    styles.item,
                                    hasBorder && styles.border
                                ]}
                                onPress={() => {
                                    !isActive && handlerChange(item)
                                }}
                            >
                                <Text style={[
                                    styles.itemLabel,
                                    isActive && styles.isActive 
                                ]}>{ item.label }</Text>
                            </RectButton>
                        )
                    })
                }
            </View>

            <RectButton style={ styles.cancel } activeOpacity={ 0.1 } onPress={ () => sheetRef.current.hide() }>
                <Text style={ styles.cancelText }>取消</Text>
            </RectButton>

        </ActionSheet>
    )
}