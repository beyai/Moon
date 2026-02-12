import { StyleSheet, UnistylesRuntime, useUnistyles } from 'react-native-unistyles'
import { defaultTheme } from './defaultTheme'
import { lightTheme } from './lightTheme'
import { darkTheme } from './darkTheme'
import { useEffect } from 'react'
import { DeviceState, useDeviceStore } from '@/Store'
import { ThemeMode } from '@/Constraint'

const AppThemes = {
    // light: {
    //     ...defaultTheme,
    //     ...lightTheme,
    // },
    dark: {
        ...defaultTheme,
        ...darkTheme
    },
}

type AppThemesTypes = typeof AppThemes
declare module 'react-native-unistyles' {
    export interface UnistylesThemes extends AppThemesTypes {}
}

StyleSheet.configure({
    settings: {
        // adaptiveThemes: true
        initialTheme: 'dark'
    },
    themes: AppThemes,
})

export function useColorScheme() {
    // const { rt }    = useUnistyles()
    // const { theme } = useDeviceStore()

    // useEffect(() => {
    //     let colorScheme = theme
    //     const isSystem = theme == ThemeMode.system
    //     UnistylesRuntime.setAdaptiveThemes(isSystem)
    //     if (isSystem) {
    //         colorScheme = rt.colorScheme as ThemeMode
    //     }
    //     DeviceState.colorScheme = colorScheme
    //     if (!isSystem) {
    //         UnistylesRuntime.setTheme(colorScheme as any)
    //     }
    // }, [ theme, rt.colorScheme ])

}