import React from "react";
import type { ReactNode } from 'react'
import { Text, View } from "react-native";
import { CellGroupStyles } from "./styles";

interface CellGroupProps {
    // 标题
    title?: string;
    // 是否展示圆角卡片风格
    inset?: boolean;
    // 是否显示外边框
    border?: boolean;
    // 子元素
    children: ReactNode
}

export const CellGroup = React.memo(function({
    title,
    inset,
    border,
    children
}: CellGroupProps) {

    CellGroupStyles.useVariants({
        inset,
        border: inset ? false : border,
    })

    return (
        <View style={ CellGroupStyles.wrapper }>
            {
                title && (
                    <Text style={ CellGroupStyles.header  }>{ title }</Text>
                )
            }
            <View 
                style={ CellGroupStyles.container }
            >
                { children }
            </View>
        </View>
    )
})