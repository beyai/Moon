import { StyleSheet } from 'react-native-unistyles'
export default StyleSheet.create((theme, rt) => {
    const { width } = rt.screen;
    const bgWidth =  width - ( theme.space4 * 2 )
    const bgHeight = ( 133 / 828 ) * bgWidth
    return {

        list: {
            flex: 1,
        },

        container: {
            marginHorizontal: theme.space4
        },

        item: {
            marginVertical: theme.space2,
            // shadowColor: '#000',
            // shadowOffset: { width: 0, height: 10 },
            // shadowOpacity: 0.1,
            // shadowRadius: 20,
            // elevation: 10,
        },

        itemWrapper: {
            overflow: 'hidden',
            position: 'relative',
            padding: theme.space4,
            borderRadius: theme.borderRadiusMedium,
            backgroundColor: theme.componentBgColor,
        },

        bg: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: bgWidth,
            height: bgHeight
        },

        img: {
            position: 'absolute',
            left: -20,
            bottom: -20,
            width: 150,
            height: 80,
            opacity: 0.15,
        },

        active: {
            // borderColor: theme.colorPrimary,
            shadowColor: theme.colorPrimary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.35,
            shadowRadius: 3,
        },

        header: {
            flexDirection: 'row',
            alignItems: 'center'
        },

        avatar: {
            width: 30,
            height: 30,
            borderRadius: 30,
            backgroundColor: theme.pageColor,
            marginRight: theme.space2
        },

        title: {
            color: theme.textColorPrimary,
            fontSize: theme.fontSize,
            fontWeight: 700,
        },

        content: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -theme.space4,
            marginTop: theme.space2
        },

        meta: {
            width: '50%',
            flexDirection: 'row',
            paddingHorizontal: theme.space4,
            marginVertical: theme.space1,
        },

        label: {
            width: 80,
            color: theme.textColorSecondary,
            fontSize: theme.fontSizeSmall,
        },

        desc: {
            flex: 1,
            color: theme.textColor,
            fontSize: theme.fontSizeSmall,
            textAlign: 'left',
        },

        tipInfo: {
            flex: 1,
            flexDirection: 'row',
            paddingHorizontal: theme.space4,
            marginVertical: theme.space1
        },

        footer: {
            marginTop: theme.space4,
            flexDirection: 'row',
            justifyContent: 'flex-end'
        },
        btn: {
            marginLeft: theme.space2
        }
    }
})