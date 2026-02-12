import { NitroModules } from 'react-native-nitro-modules'
import type { Signal as SignalType  } from '../specs/Signal/Signal.nitro'
export type { Signal, SignalState, SignalRequest, SignalResponse, RemoveListener } from '../specs/Signal/Signal.nitro'

export const SignalModule = NitroModules.createHybridObject<SignalType>('Signal')
