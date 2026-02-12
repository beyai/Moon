import { NitroModules } from 'react-native-nitro-modules'
import type { Detection as DetectionType } from '../specs/Detection/Detection.nitro'
export type { DetectLabel, DetectionResult }  from '../specs/Detection/Detection.nitro'
export const Detection = NitroModules.createHybridObject<DetectionType>('Detection')