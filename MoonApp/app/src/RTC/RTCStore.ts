import { createStore } from "@/Store/BaseStore";
import { MRTCDataChannelState, MRTCPeerState, SignalState } from "react-native-nitro-moon";

export const {
    state: RTCState,
    actions: RTCActions,
    useStore: useRtcStore,
} = createStore({

    name: 'rtcStore',
    
    persistKeys: [],

    state: {
        signalState         : null as SignalState | null,
        peerState           : null as MRTCPeerState | null,
        dataChannelState    : null as MRTCDataChannelState | null 
    },

    actions: {
        
        setSignalState(state: SignalState | null) {
            this.signalState = state
        },

        setPeerState(state: MRTCPeerState | null) {
            this.peerState = state
        },

        setDataChannelState(state: MRTCDataChannelState | null) {
            this.dataChannelState = state
        }
    }
})