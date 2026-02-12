import { StyleSheet } from 'react-native-unistyles'
import { Poker } from '@/Constraint';

export default StyleSheet.create((theme, rt) => {
    const { width } = rt.screen;
    const { bottom } = rt.insets;
    const NUM_COLUMNS = Poker.groupSize;
    const CONTAINER_PADDING = theme.space2;
    const ITEM_MARGIN = theme.space2;
    const ITEM_WIDTH = ( width - CONTAINER_PADDING * 2 ) / NUM_COLUMNS - ITEM_MARGIN * 2;
    const ITEM_HEIGHT = ITEM_WIDTH * 1.34;

    return {

        container: {
            paddingBottom: bottom
        },

        groupHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            height: theme.sizeSmall,
            paddingHorizontal: theme.space4,
            backgroundColor: theme.componentBgColor,
            borderBottomColor: theme.borderColor,
            borderBottomWidth: theme.borderSize,
        },

        groupTitle: {
            fontWeight: 600,
            fontSize: theme.fontSizeSmall,
            color: theme.textColorPrimary,
        },

        groupFooter: {
            paddingTop: theme.space4,
            backgroundColor: theme.componentBgColor,
            borderBottomColor: theme.borderColor,
            borderBottomWidth: theme.borderSize,
            marginBottom: theme.space2,
        },

        groupRow: {
            flexDirection: "row",
            paddingTop: theme.space4,
            paddingHorizontal: theme.space2,
            backgroundColor: theme.componentBgColor,
        },

        groupItem: {
            width: ITEM_WIDTH,
            height: ITEM_HEIGHT,
            marginHorizontal: ITEM_MARGIN,
            borderRadius: 4,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            borderWidth: theme.borderSize,
            borderColor: theme.borderColor,
        }
    }
})