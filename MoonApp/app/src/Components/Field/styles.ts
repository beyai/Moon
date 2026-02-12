import { StyleSheet } from 'react-native-unistyles'

export const FieldNumberStyles = StyleSheet.create((theme) => {
    return {
        warpper: (width: number = 100) => ({
            flexDirection: 'row',
            width: width,
        }),

        text: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: theme.space1
        },

        value: {
            fontSize: theme.fontSize,
            color: theme.textColorPrimary,
        },
    }
})


export const FieldStyles = StyleSheet.create((theme) => {
    return {

        wrapper: {
            paddingHorizontal: theme.space4,
        },

        container: {
            flexDirection: 'row',
            alignItems: 'center',
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
                    }
                }
            }
        }),

        center: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.space3,
            height: theme.sizeMedium,
            
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

        input: {
            flex: 1,
            fontSize: theme.fontSize,
            color: theme.textColorPrimary,
            height: theme.sizeMedium,
            variants: {
                align: {
                    left: {
                        textAlign: 'left'
                    },
                    center: {
                        textAlign: 'center'
                    },
                    right: {
                        textAlign: 'right'
                    }
                }
            }
        },

        btn: {
            marginLeft: theme.space2,
            color: theme.textColorSecondary
        },

    }
})
