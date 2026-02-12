import { StyleSheet } from "react-native-unistyles"

export default StyleSheet.create((theme, rt) => {
    return {
        wrapper: {
            borderTopLeftRadius: theme.borderRadiusMedium,
            borderTopRightRadius: theme.borderRadiusMedium,
            backgroundColor: theme.pageColor,
            overflow: 'hidden',
        },

        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: "space-between",
            height: theme.sizeMedium,
            paddingHorizontal: theme.space2,
        },

        headerBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.space2,
            height: theme.sizeSmall,
            backgroundColor: theme.colorButton,
            borderRadius: theme.borderRadiusSmall,
        },

        body: (height: number) => {
            return {
                height: height,
                borderBottomColor: theme.borderColor,
                borderBottomWidth: theme.borderSize,
                backgroundColor: theme.componentBgColor,
            }
        },

        border: {
            borderBottomColor: theme.borderColor,
            borderBottomWidth: theme.borderSize
        },

        titleText: {
            color: theme.textColorPrimary,
            fontSize: theme.fontSizeMedium,
            fontWeight: 600
        },

        item: {
            paddingHorizontal: theme.space4,
        },

        itemWrapper:(itemHeight: number) => ({
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            height: itemHeight ?? theme.sizeMedium,
        }),

        itemLabel: {
            flex: 1,
            marginLeft: theme.space2,
            color: theme.textColorPrimary,
            fontSize: theme.fontSize,
        },

        itemDesc: {
            flexShrink: 0,
            marginLeft: theme.space2,
            fontSize: theme.fontSizeSmall,
            color: theme.textColorSecondary,
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
            backgroundColor: theme.componentBgColor,
        },

        cancelText: {
            color: theme.colorError,
            fontSize: theme.fontSizeMedium,
            fontWeight: 600
        }
    }
})