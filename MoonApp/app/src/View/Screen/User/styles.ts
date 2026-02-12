import { StyleSheet } from 'react-native-unistyles'

export default StyleSheet.create((theme, rt) => {
    return {
        wrapper: {
            flex: 1,
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

        checkWrapper: {
            flexDirection: 'row',
            alignItems: "center",
            marginBottom: theme.space10
        },

        checkBox: {
            marginRight: theme.space2
        },

        checkText: {
            fontSize: theme.fontSizeSmall,
            color: theme.textColor
        },

        checkTextPrimary: {
            fontSize: theme.fontSizeSmall,
            color: theme.colorPrimary
        },

        btn: {
            marginTop: theme.space4
        },

        footer: {
            paddingHorizontal: theme.space4,
            paddingTop: theme.space4
        },

        logoutText: {
            fontSize: theme.fontSize,
            color: theme.colorError
        }
    }
})