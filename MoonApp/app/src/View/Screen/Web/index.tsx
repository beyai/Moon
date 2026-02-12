import { ParamListBase } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import WebView from "react-native-webview";


export function WebPage({ navigation, route }: NativeStackScreenProps<ParamListBase, "WebPage"> ) {
    const params = route.params as unknown as {
        title: string;
        url: string;
    }
    useEffect(() => {
        navigation.setOptions({
            title: params.title ?? ''
        })
    }, [])

    return (
        <WebView
            style={{ flex: 1 }}
            source={{ uri: params.url }}
        />
    )
}