import React from "react";
import { ImageBackground } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

type PageLayoutProps = {
    children: React.ReactElement
}

export function PageLayout({ children }: PageLayoutProps) {
    return (
        <ImageBackground
            style={{ flex: 1 }}
            source= {{ uri: "PageBackgroundDark" }}
            resizeMode='cover'
        >
            { children}
        </ImageBackground>
    )
}