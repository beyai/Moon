import { StyleSheet } from "react-native-unistyles"


export default StyleSheet.create((theme) => {

    return {
        wrapper: {
            borderRadius: 0,
            backgroundColor: "transparent",
            paddingHorizontal: theme.space2,
        },

        container: {
            backgroundColor: theme.pageColor,
            borderRadius: theme.borderRadius,
            overflow: "hidden"
        },

        border: {
            borderBottomColor: theme.borderColor,
            borderBottomWidth: theme.borderSize
        },

        title: {
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.space3,
        },

        titleText: {
            color: theme.textColorSecondary,
            fontSize: theme.fontSizeSmall,
        },

        item: {
            justifyContent: 'center',
            alignItems: 'center',
            height: theme.sizeMedium,
        },

        itemLabel: {
            color: theme.textColorPrimary,
            fontSize: theme.fontSizeMedium,
        },

        isActive: {
            color: theme.colorPrimary
        },

        cancel: {
            marginTop: theme.space2,
            justifyContent: 'center',
            alignItems: 'center',
            height: theme.sizeMedium,
            borderRadius: theme.borderRadius,
            backgroundColor: theme.pageColor,
        },

        cancelText: {
            color: theme.colorError,
            fontSize: theme.fontSizeMedium,
            fontWeight: 600
        }
    }
})