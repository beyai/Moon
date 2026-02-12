import { Animated, StyleProp, Text, TextStyle, View, ViewStyle} from "react-native";
import {  NativeStackHeaderProps } from "@react-navigation/native-stack";
import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from './styles'
import { Icon } from "../Icon";
import { RectButton } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import React, { ReactNode } from "react";

interface BackButtonProps {
    transparent?: boolean;
}

interface HeaderBarProps {
    title: string;
    transparent?: boolean;
    backVisible?: boolean;
    border?: boolean;
    left?: ReactNode;
    right?: ReactNode;
    height?: number;
    titleStyle?: StyleProp<Pick<TextStyle, 'fontFamily' | 'fontSize' | 'fontWeight'> & { color?: string; }>;
    style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
}

// 返回按键
function BackButton({ 
    transparent = false
}: BackButtonProps ) {
    const navigation = useNavigation();
    styles.useVariants({ transparent: transparent })
    return (
        <RectButton
            activeOpacity={ 0 }
            style={ styles.back }
            onPress={() => {
                navigation.canGoBack() && navigation.goBack()
            }}
        >
            <Icon name="arrow-left" style={ styles.icon } />
        </RectButton>
    )
}

// 渲染导航栏
const HeaderBarView = React.memo(function HeaderBarView({
    title,
    titleStyle,
    transparent, 
    border, 
    left, 
    right,
    height = 44,
    style,
}: HeaderBarProps) {
    styles.useVariants({ transparent, border });
    return (
        <Animated.View style={ styles.wrapper(style) }>
            <SafeAreaView edges={["top"]}>
                <View style={ styles.container(height) }>

                    <View style={ styles.left }>
                        { left }
                    </View>

                    <View style={ styles.center }>
                        <Text style={ [ styles.title, titleStyle ] } numberOfLines={ 1 }>
                            { title }
                        </Text>
                    </View>

                    <View style={ styles.right }>
                        { right }
                    </View>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
})

const RenderTabHeader = React.memo(function(props: BottomTabHeaderProps) {
    const { route, navigation, options  } = props;
    const canGoBack = navigation.canGoBack();
    const { 
        title, headerLeft, headerRight, 
        headerStyle,
        headerTransparent = false, 
        headerShadowVisible = false 
    } = options
    return (
        <HeaderBarView
            style={ headerStyle }
            title={ title ?? route.name }
            transparent={ headerTransparent }
            border={ headerShadowVisible }
            left = { headerLeft?.({ canGoBack }) }
            right={ headerRight?.({ canGoBack }) }
        />
    )
})

const RenderStackHeader = React.memo(function(props: NativeStackHeaderProps) {
    const { route, navigation, options  } = props;
    const canGoBack = navigation.canGoBack();
    const { title, 
        headerLeft, headerRight, 
        headerTitleStyle,  headerStyle, presentation, 
        headerTransparent = false, 
        headerShadowVisible = false,
        headerBackVisible = true,
    } = options
    let height = (presentation && ['modal', 'pageSheet'].includes(presentation)) ? 60 : 44;
    return (
        <HeaderBarView
            style={ headerStyle }
            height={ height }
            title={ title ?? route.name }
            titleStyle={ headerTitleStyle }
            transparent={ headerTransparent }
            border={ headerShadowVisible }
            backVisible={ headerBackVisible }
            left = {
                headerLeft 
                ? headerLeft({ canGoBack }) 
                : ( canGoBack && headerBackVisible  ) && <BackButton transparent={ headerShadowVisible } />
            }
            right={ headerRight?.({ canGoBack }) }
        />
    )
})

export function HeaderBar(props:  NativeStackHeaderProps | BottomTabHeaderProps ) {
    if ('back' in props) {
        return <RenderStackHeader { ...props } />
    } else {
        return <RenderTabHeader { ...props as BottomTabHeaderProps } />
    }
}


export function RightButton(props: {
    icon?: string;
    text: string;
    onClick?: () => void
}) {
    return (
        <RectButton
            style={ styles.rightBtn }
            underlayColor="transparent"
            onPress={ props.onClick  }
        >
            { props.icon && <Icon name={ props.icon } style={ styles.rightBtnIcon } /> }
            <Text style={ styles.rightBtnText } >{ props.text }</Text>
        </RectButton>
    )
}