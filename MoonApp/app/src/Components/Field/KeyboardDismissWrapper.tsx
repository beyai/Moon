import { TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, ViewStyle } from "react-native";
import { memo, ReactNode } from 'react'

interface WrapperProps {
    style?: ViewStyle;
    children: ReactNode;
    behavior?: 'height' | 'position' | 'padding' | undefined;
}

export const KeyboardDismissWrapper = memo(function ({ 
    style,
    behavior,
    children 
}: WrapperProps) {
    return (
        <TouchableWithoutFeedback onPress={ Keyboard.dismiss } accessible={ false }>
            <KeyboardAvoidingView behavior={ behavior } style={ style }>
                { children }
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    )
})