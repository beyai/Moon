import { StyleSheet } from 'react-native-unistyles'

export default StyleSheet.create((theme, rt) => {
    const { width } = rt.screen;
    return {
        Wrapper: {
            position: 'relative',
            alignItems: 'center',
            flex: 1
        },

        Container: {
            width: width,
        },

        /** 中心指示器 */
        Indicator: {
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'space-between',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        },
        
        IndicatorText: {
            width: '50%',
            height: theme.fontSizeMedium * 1.5,
            textAlign: 'center',
            fontWeight: 700,
            color: theme.colorWarning,
            fontSize: theme.fontSizeMedium,
        },

        IndicatorLine: {
            position: 'absolute',
            top: 25,
            bottom: 0,
            flex: 1,
            width: 1,
            zIndex: 1,
            backgroundColor: theme.colorWarning,
        },

        IndicatorRriangle: {
            flexShrink: 0,
            top: 0,
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
            borderLeftWidth: 3, 
            borderRightWidth: 3, 
            borderBottomWidth: 6,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: theme.colorWarning,
        },

        Tick: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'flex-end',
        },

        TickValue: {
            position: 'absolute',
            fontSize: 9,
            textAlign: 'center',
            color: 'white',
            width: 40,
        },

        TickLine: {
            width: 1,
            backgroundColor: 'white'
        }
    }
})