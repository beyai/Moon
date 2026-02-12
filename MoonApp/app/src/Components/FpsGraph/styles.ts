import { StyleSheet } from "react-native-unistyles";

export default StyleSheet.create( (theme, runtime) => {
    return {

        Container: {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            borderRadius: 5,
            overflow: 'hidden',
        },

        Bar: {
            height: 5,
            backgroundColor: 'rgba(243, 74, 77, 1)'
        },

        TextWrapper: {
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            justifyContent: 'center',
            alignItems: 'center',
        },
        
        Text: {
            position: 'absolute',
            fontWeight: 700,
            fontSize: 14,
            color: "white"
        },
        
        setContainerSize(width, height) {
            return {
                width, height
            }
        },
    }
})