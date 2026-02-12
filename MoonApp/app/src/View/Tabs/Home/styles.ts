import { StyleSheet } from 'react-native-unistyles'

export default StyleSheet.create((theme, rt) => {
    return {
        wrapper: {
            flex: 1,
        },

        addBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            height: 36,
            padding: theme.space1
        },

        addIcon: {
            fontSize: theme.fontSize,
            color: theme.colorPrimary,
            marginRight: theme.space1,
        },

        addText: {
            fontSize: theme.fontSize,
            color: theme.colorPrimary,
        },

        active: {
            width: 110,
            flexDirection: 'row',
            marginTop: theme.space4,
            marginRight: theme.space4,
        },

        activeItem: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },

        activeEdit: {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colorWarning,
            borderRadius: 100,
            width: 50,
            height: 50,
        },

        activeDelete: {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colorError,
            borderRadius: 100,
            width: 50,
            height: 50,
        },

        activeText: {
            color: 'white',
            fontSize: theme.fontSizeSmall,
        },

        item: {
            height: 108,
            marginTop: theme.space4,
            marginHorizontal: theme.space4,
            borderRadius: theme.borderRadius,
            backgroundColor: theme.componentBgColor,
        },

        itemWrapper: {
            flexDirection: 'row',
            padding: theme.space4,
        },

        itemCheck: {
            flexShrink: 0,
        },

        itemContainer: {
            flex: 1,
            marginLeft: theme.space4,
        },

        itemTitle: {
            fontSize: theme.fontSizeMedium,
            color: theme.textColorPrimary,
            fontWeight: 600
        },

        itemDesc: {
            textAlign: 'justify',
            color: theme.textColor,
            fontSize: theme.fontSize,
            lineHeight: theme.fontSize * 1.6,
            marginTop: theme.space2,
        },
        
    }
})