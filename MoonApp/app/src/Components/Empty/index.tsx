import {  ReactNode } from "react";
import { Image, View, Text } from "react-native";
import styles from "./styles";

export function Empty(props: {
    title: string;
    children?: ReactNode;
    
}) {
    const { title, children } = props
    return (
        <View style={ styles.wrapper }>
            <Image source={{ uri: 'empty'}} width={ 240 } height={ 142 } resizeMode="contain" />
            <Text style={ styles.title }>{ title }</Text>
            {
                !!children && (
                    <View style={ styles.footer }>
                        { children }
                    </View>
                )
            }
        </View>
    )
}