import { StyleSheet } from 'react-native-unistyles'

export default StyleSheet.create((theme, rt) => {
    return {
        wrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: theme.sizeMedium,
            backgroundColor: theme.colorButton,
            paddingHorizontal: theme.space4,
            
            variants: {

                isDisabled: {
                    true: {
                        opacity: 0.2
                    }
                },

                shape: {
                    square: {
                        borderRadius: theme.borderRadius,
                    },
                    round: {
                        borderRadius: 100,
                    }
                },

                size: {
                    medium: {
                        height: theme.sizeMedium,
                        borderRadius: theme.borderRadius,
                    },
                    small: {
                        height: theme.sizeSmall,
                        borderRadius: theme.borderRadiusSmall,
                        paddingHorizontal: theme.space3,
                    },
                    default: {
                        height: theme.sizeBase,
                        borderRadius: theme.borderRadius,
                        paddingHorizontal: theme.space4,
                    }
                },
                border: {
                    true: {
                        borderWidth: theme.borderSize,
                        borderColor: theme.borderColor,
                    }
                }
            },

            compoundVariants: [
                {
                    type: 'primary',
                    status: 'normal',
                    styles: {
                        backgroundColor: theme.colorPrimary,
                    }
                },
                {
                    type: 'primary',
                    status: 'success',
                    styles: {
                        backgroundColor: theme.colorSuccess,
                    }
                },
                {
                    type: 'primary',
                    status: 'warning',
                    styles: {
                        backgroundColor: theme.colorWarning,
                    }
                },
                {
                    type: 'primary',
                    status: 'error',
                    styles: {
                        backgroundColor: theme.colorError,
                    }
                },
                {
                    type: 'text',
                    styles: {
                        backgroundColor: 'transparent'
                    }
                }
            ],
        },

        icon: {
            marginRight: theme.space2,
            variants: {
                size: {
                    default: {
                        fontSize: theme.fontSize
                    },
                    medium: {
                        fontSize: theme.fontSize
                    },
                    small: {
                        fontSize: theme.fontSize
                    }
                },
                onlyIcon: {
                    true: { marginRight: 0 },
                }
            }
        },

        text: {
            fontWeight: 500,
            variants: {
                size: {
                    default: {
                        fontSize: theme.fontSize
                    },
                    medium: {
                        fontSize: theme.fontSizeMedium
                    },
                    small: {
                        fontSize: theme.fontSizeSmall
                    }
                }
            },
            
        },

        textColor: {
            color:  theme.textColorPrimary,
            variants: {
            },
            compoundVariants: [
                {
                    type: 'secondary',
                    status: 'normal',
                    styles: {
                        color: theme.textColorPrimary,
                    }
                },
                {
                    type: 'secondary',
                    status: 'success',
                    styles: {
                        color: theme.colorSuccess,
                    }
                },
                {
                    type: 'secondary',
                    status: 'warning',
                    styles: {
                        color: theme.colorWarning,
                    }
                },
                {
                    type: 'secondary',
                    status: 'error',
                    styles: {
                        color: theme.colorError,
                    }
                },
                {
                    type: 'primary',
                    styles: {
                        color: 'white'
                    }
                },
                {
                    type: 'text',
                    styles: {
                        color: theme.textColor
                    }
                },
                {
                    type: 'text',
                    status: 'success',
                    styles: {
                        color: theme.colorSuccess,
                    }
                },
                {
                    type: 'text',
                    status: 'warning',
                    styles: {
                        color: theme.colorWarning,
                    }
                },
                {
                    type: 'text',
                    status: 'error',
                    styles: {
                        color: theme.colorError,
                    }
                },
            ],
        },

    }
})