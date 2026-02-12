import { useEffect, useLayoutEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SheetProvider } from 'react-native-actions-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {  useUnistyles } from 'react-native-unistyles';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { ToastProvider, useToast } from '@/Components/Toast';
import AuthStackScreen from '@/View/Auth'
import StackScreen from '@/View/Screen';
import TabScreen from '@/View/Tabs';
import { AuthActions, useAuthStore, useDeviceStore } from './Store';
import '@/Components/ActionSheet'
import { useColorScheme } from './Theme';
import { PageLayout } from './Components/Page';

function MainScreen() {
    const { isLogin } = useAuthStore()

    const toast = useToast()

    // 登录成功，加载用户信息
    useLayoutEffect(() => {
        if (isLogin) {
            AuthActions.userInit().catch(error => {
                toast.error(error.message, { duration: 2000 })
            })
        }
    }, [ isLogin ])

    return <PageLayout>
        {
            isLogin
            ? <StackScreen tabScreen={ TabScreen } />
            : <AuthStackScreen  />
        }
    </PageLayout>
}

export function App() {
    useColorScheme()
    const { theme, rt: { screen } } = useUnistyles()
    const deviceStore = useDeviceStore()
    
    // App 主题
    const AppTheme = useMemo<Theme>(() => {
        return {
            dark: deviceStore.colorScheme === 'dark',
            fonts: DefaultTheme.fonts,
            colors: {
                primary     : theme.colorPrimary,
                background  : 'rgba(0,0,0,0.1)',
                card        :'rgba(0,0,0,0.3)',
                // background  : theme.pageColor,
                // card        : theme.pageColor,
                text        : theme.textColorPrimary,
                border      : theme.borderColor,
                notification: theme.colorError
            },
        }
    }, [ deviceStore.colorScheme, theme ])

    const BgImage = useMemo(() => {
        return {
            uri: "PageBackgroundDark"
        }
    }, [ deviceStore.colorScheme ])


    return (
        <GestureHandlerRootView>
            <SafeAreaProvider>
                <SheetProvider>
                    <ToastProvider>
                        <NavigationContainer theme={ AppTheme }>
                            <MainScreen />
                        </NavigationContainer>
                    </ToastProvider>
                </SheetProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    )
}


