import { StyleSheet } from 'react-native-unistyles'

export const SliderCaptchaStyles = StyleSheet.create((theme) => {
    return {
        
        container: {
            position: 'relative',
            width: '100%',
            height: theme.sizeMedium,
            borderRadius: theme.borderRadius,
            backgroundColor: theme.componentBgColor,
            justifyContent: 'center',
            overflow: 'hidden',
            borderStyle: 'solid',
            borderWidth: theme.borderSize,
            borderColor: theme.borderColor
        },

        mask: {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            backgroundColor: theme.colorSuccess,
            borderRadius: theme.borderRadius,
            variants: {
                status: {
                    5: {
                        backgroundColor: theme.colorError,
                    }
                }
            }
        },

        tipsContainer: {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
        },

        tipsText: {
            fontSize: theme.fontSize,
            color: '#909399',
            variants: {
                status: {
                    1: {
                        color: theme.textColorSecondary,
                    },
                    2: {
                        color: 'white',
                    },
                    3: {
                        color: 'white',
                    },
                    4: {
                        color: 'white',
                    },
                    5: {
                        color: 'white',
                    }
                }
            }
        },
        btn: {
            position: 'absolute',
            left: 0,
            width: theme.sizeMedium,
            height: theme.sizeMedium,
            backgroundColor: theme.pageColor,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.borderRadius,
            zIndex: 2,
            borderWidth: theme.borderSize,
            borderColor: theme.borderColor
        },
        icon: {
            fontSize: theme.fontSizeMedium,
            color: theme.textColorSecondary,
            variants: {
                status: {
                    3: {
                        color: theme.colorPrimary,
                    },
                    4: {
                        color: theme.colorSuccess,
                    },
                    5: {
                        color: theme.colorError,
                    }
                }
            }
        },
    }
})