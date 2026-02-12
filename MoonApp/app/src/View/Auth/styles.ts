import { StyleSheet } from 'react-native-unistyles'

export default StyleSheet.create((theme, rt) => {
    return {
        loginWrapper: {
            flex: 1,
            justifyContent: 'center',
        },

        registerWrapper: {
            flex: 1,
        },

        logo: {
            width: 150,
            height: 121.43,
            alignSelf: 'center',
            marginBottom: theme.space4,
        },

        title: {
            alignSelf: 'center',
            color: theme.colorPrimary,
            fontSize: 24,
            fontWeight: 600,
            marginBottom: theme.space10,
        },

        footer: {
            paddingHorizontal: theme.space4,
            paddingTop: theme.space4
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
        }

    }
})