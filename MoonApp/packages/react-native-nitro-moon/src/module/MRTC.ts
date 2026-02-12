import { NitroModules } from 'react-native-nitro-modules'
import type { MRTC as MRTCType  } from '../specs/MRTC/MRTC.nitro'

export type { MRTCLiveStream, MRTCIceServer } from '../specs/MRTC/MRTC.nitro'
export * from '../specs/MRTC/MRTCPeer.nitro'
export const MRTC = NitroModules.createHybridObject<MRTCType>('MRTC')