import React from "react";
import { ViewStyle, View, Image, ImageStyle } from "react-native"
import { Poker } from "@/Constraint";

interface PokerImgProps {
    name?: Poker.Name;
    style?: ViewStyle;
    size?: number
}

function PokerImg({
    name = 'POKER',
    size = 30,
    style,
}: PokerImgProps) {
    let imgName: Poker.Name = Poker.keys.includes(name) ? name : "POKER"
    const imageStyle = {
        width: size,
        height: size * 1.34,
        overflow: 'hidden',
    } as ImageStyle

    return (
        <View style={ style }>
            <Image source={ { uri: imgName} } style={ imageStyle } />
        </View>
    )
}

export default React.memo(PokerImg)