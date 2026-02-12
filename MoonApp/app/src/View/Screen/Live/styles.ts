import { StyleSheet } from 'react-native-unistyles'

export default StyleSheet.create((theme, rt) => {
    const { width } = rt.screen
    return {

        wrapper: {
            position: 'relative',
            flex: 1,
            backgroundColor: 'black'
        },

        backBtn: {
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: "center",
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 40
        },

        backIcon: {
            fontSize: 24,
            color: 'white'
        },

        camera: {
            width,
            height: width * ( 16 / 9 )
        },

        fps: {
            position: 'absolute',
            top: rt.insets.top + 50,
            right: 15
        },

        container: {
            flex: 1,
            position: 'relative',
        },

        footer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: "space-around",
            marginHorizontal: theme.space4,
        },

        orientation(orientation: 'up' | 'left' | 'down' | 'right') {
            let rotate = 0;
            if (orientation == 'left') {
                rotate = 90
            } else if (orientation == 'down') {
                rotate = 180
            } else if (orientation == 'right') {
                rotate = 270
            } else  {
                rotate = 0
            }
            return {
                transform: [
                    { rotate: `${ rotate }deg` }
                ]
            }
        },

        ruler: {
            position: 'absolute',
            width,
            height: 110,
            bottom: '100%',
            backgroundColor: 'rgba(0,0,0,0.75)',
        },

        rulerContainer: {
            flex: 1,
            overflow: 'hidden'
        },

        rulerTab: {
            height: 40,
            flexDirection: 'row',
            borderTopColor: 'rgba(255,255,255,0.3)',
            borderTopWidth: theme.borderSize,
            marginTop: theme.space1,
        },

        rulerTabItem: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderBottomColor: 'rgba(255,255,255,0.2)',
            borderWidth: theme.borderSize,

            variants: {
                border: {
                    true: {
                        borderLeftColor: 'rgba(255,255,255,0.3)',
                    }
                },
            }
        },

        rulerTabLabel: {
            color: 'white',
            variants: {
                active: {
                    true: {
                        color: theme.colorWarning
                    }
                }
            }
        },

        onlineState: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        onlineStateDot: {
            width: 8,
            height: 8,
            borderRadius: 8,
            marginRight: theme.space1,
            variants: {
                online: {
                    true: {
                        backgroundColor: theme.colorWarning
                    },
                    false: {
                        backgroundColor: theme.colorError
                    }
                }
            }
        },
        onlineStateText: {
            fontSize: 13,
            color: 'white',
            textShadowColor: 'rgba(0,0,0,0.4)',
            textShadowOffset: { width: 1, height: 2 },
            textShadowRadius: 2,
        }

    }
})