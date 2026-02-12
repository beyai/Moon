import { StyleSheet  } from "react-native-unistyles";

export default StyleSheet.create((theme, rt) => {
    const { width, height } = rt.screen;
    return {
        Mask: {
            position: 'absolute', 
            top: 0, 
            left: 0,
            zIndex: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            width, 
            height 
        }
    }
})
