import { StyleSheet } from 'react-native-unistyles'


export default StyleSheet.create((theme, rt) => {

    return {
        wrapper: (style) => {
            const data = {
                backgroundColor: theme.componentBgColor,
                ...style,
                variants: {
                    transparent: {
                        true: {
                            backgroundColor: 'transparent'
                        }
                    },
                    border: {
                        true: {
                            borderBottomWidth: theme.borderSize,
                            borderBottomColor: theme.borderColor,
                            borderStyle: 'solid',
                        }
                    }
                }
            }
            return data
        },

        container: (height: number = 44) => ({
            flexDirection: "row",
            justifyContent: 'space-between',
            alignItems: 'center',
            height: height,
        }),

        left: {
            width: '30%',
            justifyContent: 'flex-start',
            marginHorizontal: theme.space2,
        },

        center: {
            flex: 1,
            maxWidth: "50%",
            flexDirection: "row",
            justifyContent: 'center',
            alignItems: 'center',
        },

        right: {
            width: '30%',
            flexDirection: "row",
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginHorizontal: theme.space2,
        },

        title: {
            color: theme.textColorPrimary,
            fontSize: theme.fontSizeMedium,
            fontWeight: 600,
        },

        back: {
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: "center",
            variants: {
                transparent: {
                    true: {
                        borderRadius: 36,
                        borderColor: theme.borderColor,
                        borderWidth: theme.borderSize,
                        backgroundColor: theme.componentBgColor,
                    }
                },
            }
        },

        icon: {
            fontSize: 24,
            color: theme.textColorPrimary
        },

        rightBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            height: 36,
            paddingHorizontal: theme.space3,
            borderRadius: theme.borderRadiusSmall
        },

        rightBtnIcon: {
            fontSize: theme.fontSizeMedium,
            color: theme.colorPrimary,
            marginRight: theme.space1,
        },

        rightBtnText: {
            fontSize: theme.fontSize,
            color: theme.colorPrimary,
            fontWeight: 700
        }
    }
})