import { TouchableNativeFeedback, TouchableOpacity, View, ViewStyle } from "react-native";
import { Icon } from "../Icon";
import React, { useMemo } from "react";
import { CheckStyles } from "./styles";

interface CheckProps<T> {
    style?: ViewStyle;
    value?: T;
    checkedValue?: T,
    uncheckedValue?: T,
    disabled?: boolean;
    onChange?: (value: T) => void
}

function CheckView({
    style,
    value,
    checkedValue = true,
    uncheckedValue = false,
    disabled = false,
    onChange
}: CheckProps<any>) {

    const isChecked = useMemo(() => { return value === checkedValue }, [ value, checkedValue ])
    CheckStyles.useVariants({ isChecked })

    return (
        <TouchableOpacity 
            activeOpacity={ 1 }
            style={[style, CheckStyles.wrapper]}
            onPress={ () => {
                onChange?.(isChecked ? uncheckedValue : checkedValue)
            }}
        >
            { isChecked && <Icon name="check" color="white" size={12} /> }
        </TouchableOpacity>
    )
}

export const Check = React.memo(CheckView)