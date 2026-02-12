import { StyleSheet } from 'react-native-unistyles'

export default StyleSheet.create((theme, rt) => {
    return {

        wrapper: {
            flex: 1,
            marginTop: rt.statusBar.height,
        },

        header: {
            alignItems: 'center',
            marginTop: 60,
            marginBottom: 30
        },

        avatar: {
            width: 96,
            height: 96,
            borderRadius: 96,
            backgroundColor: theme.componentBgColor,
        },

        username: {
            color: theme.textColorPrimary,
            fontSize: theme.fontSizeLarge,
            fontWeight: 600,
            marginTop: theme.space4,
        },
        extraText: {
            color: theme.textColorSecondary,

        }
    }
})