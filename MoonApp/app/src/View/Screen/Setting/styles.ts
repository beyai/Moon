import { StyleSheet } from 'react-native-unistyles'

export default StyleSheet.create((theme, rt) => {
    return {
        sliderText: {
            width: 40,
            textAlign: 'right',
            fontSize: theme.fontSize,
            color: theme.textColor
        }
    }
})