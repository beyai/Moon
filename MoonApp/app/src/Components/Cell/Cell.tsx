import { Text, TouchableHighlight, View } from "react-native";
import { CellStyles } from "./styles";
import { useUnistyles } from "react-native-unistyles";
import { memo, type ReactNode } from "react";
import { Icon } from "../Icon";


interface CellProps {
    
    icon?: string;
    iconType?: 'image' | 'font',

    label?: string;
    labelWidth?: number;
    labelAlign?: 'left' | 'center' | 'right';
    rendlerLabel?: ReactNode;

    content?: string;
    align?: 'left' | 'center' | 'right';

    children?: ReactNode;
    renderLink?: ReactNode;

    border?: boolean;
    isLink?: boolean;
    onClick?: () => void;
}

export const Cell = memo(function({
    label,
    labelWidth = 60,
    labelAlign = 'left',
    icon,
    iconType = "font",
    rendlerLabel,
    content,
    align = 'right',
    children,
    renderLink,
    border = true,
    isLink = false,
    onClick
}: CellProps) {

    const { theme } = useUnistyles()
    CellStyles.useVariants({
        border,
        labelAlign,
        align
    })
    
    return (

        <TouchableHighlight
            activeOpacity={ 0.7 }
            underlayColor={ theme.hoverBgColor }
            style={ CellStyles.warpper }
            onPress={ onClick }
        >
            <View style={ CellStyles.container }>
                {
                    icon && (
                        <Icon type={ iconType } name={ icon } size={ 20 } style={ CellStyles.icon } />
                    )
                }
                {
                    !!rendlerLabel
                    ? <View style={ CellStyles.left(labelWidth) }>{ rendlerLabel }</View>
                    : ( 
                        !!label && (
                            <View style={ CellStyles.left(labelWidth) }>
                                <Text style={ CellStyles.label }>{ label }</Text>
                            </View>
                        ) 
                    )
                }
                <View style={ CellStyles.center }>
                    {
                        !!children ? children : (
                            <Text style={ CellStyles.content } numberOfLines={1}>{ content }</Text>
                        )
                    }
                </View>
                {
                    ( renderLink || isLink ) && (
                        <View style={ CellStyles.right }>
                            { renderLink ? renderLink : <Icon name="chevron-right" size={ 16 } style={ CellStyles.arrow } /> }
                        </View>
                    )
                }

            </View>
        </TouchableHighlight>
    )
})