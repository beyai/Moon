import React from "react";
import { Pressable, Text } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Icon } from "../Icon";
import styles from "./styles";


interface ButtonProps {
    text?: string;
    type?: 'secondary' | 'primary' | 'text';
    status?: 'normal' | 'success' | 'warning' | 'error',
    shape?: 'square' | 'round'
    size?: "medium" | "default" | "small";
    icon?: string;
    disabled?: boolean;
    style?: StyleProp<ViewStyle> | undefined,
    border?: boolean,
    onClick?: () => void;
}

export const Button = React.memo(function({
    text,
    type = "secondary",
    status = 'normal',
    shape = 'square',
    size = "medium",
    icon,
    border = false,
    disabled = false,
    onClick,
    style,
}: ButtonProps) {

    styles.useVariants({
        type: type,
        status: status,
        shape: shape,
        size: size,
        border: border,
        isDisabled: disabled,
        onlyIcon: !!icon && !text
    })
    return (
        <Pressable
            disabled={ disabled }
            onPress={ e => {
                e.stopPropagation()
                onClick && onClick()
            } }
            style={[ styles.wrapper, style ]} 
        >
            { 
                icon && <Icon name={ icon } style={ [ styles.icon, styles.textColor ] } />
            }
            {
                text && <Text style={[ styles.text, styles.textColor ]}>{ text }</Text>
            }
        </Pressable>
    )
})