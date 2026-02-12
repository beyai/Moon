import { memo, useMemo } from "react";
import { View, Text } from "react-native";
import styles from "./styles";
import { usePlayStore } from "@/Detecter/PlayStore";

const MAX_BARS = 30;
const WIDTH = 90;
const HEIGHT = 30;
const BAR_WIDTH = WIDTH / MAX_BARS

function FpsGraph({
    ...props
}) {
    const { samplesFps } = usePlayStore();

    const maxFps = useMemo(() => {
        const currentMaxFps = samplesFps.reduce((prev, curr) => Math.max(prev, curr), 0)
        return currentMaxFps;
    }, [ samplesFps ])

    const lastFps = useMemo(() => {
        return samplesFps[ samplesFps.length - 1 ]
    }, [ samplesFps])

    return (
        <View style={[ props.style, styles.Container, styles.setContainerSize(WIDTH, HEIGHT )]}>
            {
                samplesFps.map((fps, index) => {
                    let height = (fps / maxFps) * HEIGHT
                    if (Number.isNaN(height) || height < 0) {
                        height = 0
                    }
                    return <View key={ index } style={[ styles.Bar, { height, width: BAR_WIDTH }]} />
                })
            }
            {
                (lastFps != undefined && !Number.isNaN(lastFps)) && (
                    <View style={ styles.TextWrapper }>
                        <Text style={ styles.Text }>{ Math.round(lastFps) }FPS</Text>
                    </View>
                )
            }
        </View>
    )
}


export default memo(FpsGraph)