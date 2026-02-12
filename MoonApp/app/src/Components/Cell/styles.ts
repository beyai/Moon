import { StyleSheet } from 'react-native-unistyles'

export const CellGroupStyles  = StyleSheet.create((theme, rt) => {
    return {

        wrapper: {
            marginTop: theme.space4
        },

        header: {
            marginHorizontal: theme.space4,
            paddingBottom: theme.space2,
            alignItems: 'center',
            fontSize: theme.fontSize,
            color: theme.textColorSecondary,
        },

        container: {
            backgroundColor: theme.componentBgColor,

            variants: {
                border: {
                    true: {
                        borderStyle: 'solid',
                        borderTopWidth: theme.borderSize,
                        borderBottomWidth: theme.borderSize,
                        borderColor: theme.borderColor,
                    }
                },
                inset: {
                    true: {
                        marginHorizontal: theme.space4,
                        borderRadius: theme.borderRadius,
                        borderWidth: 0,
                        overflow: 'hidden'
                    }
                },
                
            }
        },
    }
})


export const CellStyles = StyleSheet.create((theme) => {
    return {

        warpper: {
            paddingHorizontal: theme.space4,
        },

        container: {
            flexDirection: 'row',
            alignItems: 'center',

            minHeight: theme.sizeMedium,
            paddingVertical: theme.space3,

            borderStyle: 'solid',
            borderBottomColor: theme.borderColor,
            borderBottomWidth: 0,

            variants: {
                border: {
                    true: {
                        borderBottomWidth: theme.borderSize,
                    }
                }
            }
        },

        icon: {
            flexShrink: 0,
            marginRight: theme.space2,
        },

        left: (labelWidth: number) => ({
            width: labelWidth,
            flexShrink: 0,
            marginRight: theme.space2,
            fontSize: theme.fontSize,
            color: theme.textColorPrimary,

            variants: {
                labelAlign: {
                    left: {
                        alignItems: 'flex-start'
                    },
                    center: {
                        alignItems: 'center'
                    },
                    right: {
                        alignItems: 'flex-end'
                    },
                }
            }
        }),

        center: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            variants: {
                align: {
                    left: {
                        justifyContent: 'flex-start'
                    },
                    center: {
                        justifyContent: 'center'
                    },
                    right: {
                        justifyContent: 'flex-end'
                    }
                }
            }
        },

        right: {
            flexShrink: 0,
            marginLeft: theme.space2,
        },

        label: {
            fontSize: theme.fontSize,
            color: theme.textColorPrimary,
        },

        content: {
            fontSize: theme.fontSize,
            color: theme.textColor,
        },

        arrow: {
            color: theme.textColorSecondary
        }
    }
})