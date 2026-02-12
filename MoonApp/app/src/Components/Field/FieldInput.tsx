import React, { useState, ReactNode, useMemo } from "react";
import { TextInput, View, Text, TouchableOpacity, ViewStyle, KeyboardTypeOptions, ReturnKeyTypeOptions } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { Icon } from "../Icon";
import { FieldStyles } from './styles'


interface FieldInputProps {
    name?: string;
    type?: 'text' | 'number' | 'numeric' | 'password' | 'email' | 'phone' | string;
    label?: string;
    value?: string;
    placeholder?: string;
    returnType?: ReturnKeyTypeOptions
    renderIcon?: ReactNode;
    renderExtra?: ReactNode;
    border?: boolean;
    hasClear?: boolean;
    children?: ReactNode;
    labelWidth?: number;
    labelAlign?: 'left' | 'center' | 'right';
    align?: 'left' | 'center' | 'right';
    onChange?: (value: string) => void
}

export const Field = React.memo(function({
    name,
    value = "",
    label = "",
    labelWidth = 60,
    labelAlign = 'left',
    type = 'text',
    returnType = 'default',
    align = 'left',
    placeholder = '请输入',
    border = true,
    hasClear = true,
    renderIcon,
    renderExtra,
    children,
    onChange,
}: FieldInputProps) {

    const { theme } = useUnistyles()
    FieldStyles.useVariants({ 
        border,
        labelAlign,
        align,
    })

    // 监听值修改
    function onChangeText(value: string) {
        onChange && onChange(value)
    }

    // 是否为密码输入框
    const isPassword: boolean = type == 'password'
    // 键盘类型
    const keyboardType = type === 'number' ? 'number-pad'
        : type === 'email' ? 'email-address'
        : type === 'phone' ? 'phone-pad'
        : 'ascii-capable'

    // 安全文本输入
    const [ secureTextEntry, setSecureTextEntry ] = useState<boolean>(isPassword)

    // 右侧按键
    const showBtn = useMemo(() => {
        if (isPassword || ( hasClear && value.length > 0)) {
            return true;
        }
        return false
    }, [ value ])

    // 右侧按键图标
    const btnIconName = useMemo(() => {
        if (isPassword) {
            return secureTextEntry ? 'browse-off' : 'browse'
        }
        return 'close'
    }, [ secureTextEntry ])
    
    // 渲染标签
    function renderLabel() {
        if (!label && !renderIcon) return;
        return (
            <View style={ FieldStyles.left(labelWidth) }>
                {
                    renderIcon ? renderIcon : (
                        <Text style={ FieldStyles.label }>{ label }</Text>
                    )
                }
            </View>
        )
    }

    // 点击按键
    function onClickBtn() {
        if (isPassword) {
            setSecureTextEntry(!secureTextEntry)
        } else {
            onChangeText('')
        }
    }

    // 渲染输入框右侧按键
    function renderIconBtn() {
        if (!showBtn) return
        return (
            <TouchableOpacity activeOpacity={ 0.7 } onPress={ onClickBtn }>
                <Icon  name={ btnIconName } size={ 20 }  style={ FieldStyles.btn } />
            </TouchableOpacity>
        )
    }

    // 渲染输入框
    function renderInput() {
        if (children) return children;
        return (
            <>
                <TextInput
                    style={ FieldStyles.input }
                    value={ value }
                    placeholder={ placeholder }
                    placeholderTextColor={ theme.textColorSecondary }
                    secureTextEntry={ secureTextEntry }
                    autoComplete="off"
                    textContentType='oneTimeCode'
                    autoCapitalize="none"
                    autoCorrect={ false }
                    spellCheck={ false }
                    keyboardType={ keyboardType }
                    returnKeyType={ returnType }
                    onChangeText={ onChangeText }

                />
                { renderIconBtn() }
            </>
        )
    }

    return (
        <View style={ FieldStyles.wrapper }>
            <View style={ FieldStyles.container }>
                { renderLabel() }
                <View style={ FieldStyles.center }>
                    { renderInput() }
                </View>
                {
                    renderExtra && (
                        <View style={ FieldStyles.right }>
                            { renderExtra }
                        </View>
                    )
                }
                
            </View>
        </View>
    )
})
