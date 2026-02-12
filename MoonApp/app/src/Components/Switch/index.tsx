import { useLayoutEffect, useState } from "react";
import { Switch as RNSwitch, SwitchProps } from "react-native";

function Switch(props: SwitchProps ) {
    const  [ visible, setVisible ] = useState(false)
    useLayoutEffect(() => {
        setTimeout(() => setVisible(true), 50)
    }, [])
    return visible && <RNSwitch {...props } />
}

export default Switch