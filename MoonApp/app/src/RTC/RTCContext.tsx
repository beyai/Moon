import React, { createContext, ReactNode, useContext, useMemo } from "react";
import { MRTCDataChannelMessage } from "react-native-nitro-moon";
import { useMRTC } from "./useMRTC";
import { useSignal } from "./useSignal";

interface RTCProviderProps {
    deviceCode: string;
    children: ReactNode;
}

export interface RTCContextType {
    sendDataChannelMessage(message: MRTCDataChannelMessage): void;
}

const RTCContext = createContext<RTCContextType | undefined>(undefined);


export const RTCProvider: React.FC<RTCProviderProps> = ({ 
    deviceCode, 
    children 
}) => {
    const signal    = useSignal(deviceCode)
    const mrtc      = useMRTC(signal)
    
    const contextValue = useMemo<RTCContextType>(() => {
        return {
            sendDataChannelMessage: mrtc.sendDataChannelMessage,
        }
     }, [])

    return (
        <RTCContext.Provider value={ contextValue }>
            { children }
        </RTCContext.Provider>
    );
};

export function useRTC(): RTCContextType {
    const context = useContext(RTCContext);
    if (context === undefined) {
        throw new Error('useRTC must be used within a RTCProvider');
    }
    return context;
}