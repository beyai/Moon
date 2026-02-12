import { StyleSheet } from 'react-native-unistyles'


export const ToastStyles = StyleSheet.create((theme) => {
    return {
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },

        toastContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 130,
            maxWidth: '60%',
            padding: theme.space4,
            borderRadius: theme.borderRadiusMedium,
            backgroundColor: 'rgba(0,0,0,0.9)',
        },

        icon: {
            width: 48,
            height: 48,
            fontSize: 48,
            marginBottom: 10,
        },

        message: {
            fontSize: theme.fontSize,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: theme.fontSize * 1.6
        },
    }
})