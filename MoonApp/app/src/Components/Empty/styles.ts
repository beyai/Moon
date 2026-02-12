import { StyleSheet } from 'react-native-unistyles'

export default StyleSheet.create((theme, rt) => {
    return {

        wrapper: {
            marginTop: theme.space10,
            alignItems: 'center',
            justifyContent: 'center'
        },

        title: {
            color: theme.textColor,
            marginTop: theme.space4,
            fontSize: theme.fontSize,
        },

        footer: {
            marginTop: theme.space10
        }

    }
})
