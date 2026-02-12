import { StyleSheet } from 'react-native-unistyles'

export default StyleSheet.create((theme, rt) => {

    const { width } = rt.screen;
    const NUM_COLUMNS = 10;
    const CONTAINER_PADDING = theme.space2;
    const ITEM_MARGIN = theme.space1;
    const ITEM_WIDTH = ( width - CONTAINER_PADDING * 2 ) / NUM_COLUMNS - ITEM_MARGIN * 2;
    const ITEM_HEIGHT = ITEM_WIDTH * 1.34;

    return {
        wrapper: {
            flex: 1,
        },

        container: {
            flex: 1,
            margin: CONTAINER_PADDING,
        },

        item: {
            width: ITEM_WIDTH,
            height: ITEM_HEIGHT,
            margin: ITEM_MARGIN,
            borderRadius: 4,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            borderWidth: theme.borderSize,
            borderColor: theme.borderColor,
        }
    }
})