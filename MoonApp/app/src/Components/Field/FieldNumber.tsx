import React, { useMemo } from 'react';
import { View, Text } from 'react-native'
import { FieldNumberStyles } from './styles'
import { Button } from '../Button';

interface FieldNumberProps {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    width?: number;
    onChange?: (value:number) => void;
}

export const FieldNumber = React.memo(function FieldNumber({
    value = 0,
    min = 0,
    max = Infinity,
    step = 1,
    width = 110,
    onChange
}: FieldNumberProps ) {
    // 当前精度
    const precision = useMemo(() => {
        const str = step.toString();
        const index = str.indexOf('.');
        return index >= 0 ? str.length - index - 1 : 0;
    }, [step])

    // 展示值
    const displayText = useMemo(() => {
        return value.toFixed(precision)
    }, [ value ])

    // 加
    function onClickPlus() {
        if (!onChange) return;
        let val = Math.min( value + step, max)
        onChange(parseFloat(val.toFixed(precision)))
    }
    // 是否禁用加
    const isDesabledPlus = useMemo(() => {
        return value >= max
    }, [value, max])

    // 减
    function onClickSubtract() {
        if (!onChange) return;
        let val = Math.max(value - step, min);
        onChange(parseFloat(val.toFixed(precision)))
    }

    // 是否禁用减
    const isDesabledSubtract = useMemo(() => {
        return value <= min
    }, [value, min])


    return (
        <View
            style={ FieldNumberStyles.warpper(width) }
        >
            <Button
                icon='remove'
                size='small'
                type='text'
                border
                disabled={ isDesabledSubtract }
                onClick={ onClickSubtract }
            />
            <View style={ FieldNumberStyles.text }>
                <Text style={ FieldNumberStyles.value } numberOfLines={ 1 }>{ displayText }</Text>
            </View>
            <Button
                icon='add'
                size='small'
                type='text'
                border
                disabled={ isDesabledPlus }
                onClick={ onClickPlus }
            />
        </View>
    )
})