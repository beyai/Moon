import React from 'react'
import { Image, Text } from "react-native";
import type { StyleProp, TextStyle, ImageStyle } from "react-native";
import { getFontIcon } from "./iconfont";
import { useUnistyles } from "react-native-unistyles";

interface IconProps {
    name: string;
    type?: 'image' | 'font'
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle | ImageStyle> | undefined
}

export const Icon = React.memo(function ({
    name,
    type = 'font',
    size =  14,
    color,
    style = {},
}: IconProps) {

    const { theme } = useUnistyles()
    
    function renderImage() {
        const imageStyle = {
            width: size,
            height: size,
            ...style,
        } as ImageStyle
        return (
            <Image
                source={{ uri: `Icon${ name }` }}
                resizeMode="cover"
                style={ imageStyle }
            />
        )
    }

    function renderFont() {
        const testStyle = {
            color: color || theme.textColor,
            fontFamily: 'iconfont',
            fontSize: size,
            ...style,
        } as TextStyle
        const iconText = getFontIcon(name)
        return (
            <Text style={ testStyle }>{ iconText }</Text>
        )
    }

    return type == 'image' ? renderImage() : renderFont()
})