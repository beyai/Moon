import React, { useState } from "react";
import Slider from "@react-native-community/slider";
import { useUnistyles } from "react-native-unistyles";
import styles from './styles'

interface SliderViewProps {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    onChange?: (value: number) => void;
}

export const SliderView = React.memo(function SliderView({
    value = 0,
    min = 0,
    max = 1,
    step = 0.1,
    precision = 2,
    onChange,
}: SliderViewProps) {

    const { theme } = useUnistyles()
    const [ currentValue, setCurrentValue ] = useState<number>(value)

    const onChangeValue = (val: number) => {
        setCurrentValue(val)
        if (typeof onChange == 'function') {
            const preciseValue = parseFloat(val.toFixed(precision));
            onChange?.(preciseValue)
        }
    }

    return (
        <Slider
            style = { styles.slider }
            value={ currentValue }
            minimumValue={ min }
            maximumValue={ max }
            step={ step }
            onValueChange={ onChangeValue }
            minimumTrackTintColor={ theme.colorPrimary }
            maximumTrackTintColor={ theme.hoverBgColor }
        />
    )
})