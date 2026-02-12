import { StyleSheet } from 'react-native-unistyles'


export const CheckStyles = StyleSheet.create((theme) => {
    return {
        wrapper: {
            width: 20,
            height: 20,
            alignItems: "center",
            justifyContent: 'center',
            borderRadius: 20,

            variants: {
                isChecked: {
                    true: {
                        backgroundColor: theme.colorPrimary
                    },
                    false: {
                        borderStyle: 'solid',
                        borderWidth: 1.5,
                        borderColor: theme.borderColor,
                        backgroundColor: theme.componentBgColor,
                    }
                }
            }
        },
    }
})