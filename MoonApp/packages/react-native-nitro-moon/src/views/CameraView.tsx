import React, { useCallback, useEffect, useRef} from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { getHostComponent } from 'react-native-nitro-modules'
import CameraConfig from '../../nitrogen/generated/shared/json/CameraConfig.json'
import type { Camera as NativeCamera, CameraFormat, CameraProps, CameraMethods, CameraOrientation, CameraFilter } from '../specs/Camera/Camera.nitro'
import { useNitroCallback } from '../hook/useNitroCallback'

export type { CameraFilter, CameraFormat, CameraOrientation, CameraPosition } from '../specs/Camera/Camera.nitro'

const NativeCameraView = getHostComponent<CameraProps, CameraMethods>('NativeCameraView', () => CameraConfig )

interface CameraViewProps {
    style?: StyleProp<ViewStyle>,
    preview?: boolean;
    filter?: CameraFilter
    fps?: number;
    zoom?: number;
    focus?: number;
    exposure?: number;
    brightness?: number;
    orientation?: CameraOrientation
    onInitialized?: () => void;
    onChangeDevice?: (format: CameraFormat) => void
}

export const CameraView = React.memo(function CameraView(
    {
        preview = true,
        filter = { position: 'back', width: 1920, height: 1080, maxFps: 60  }, 
        fps = 30,
        zoom = 1,
        focus = 1,
        exposure = 1,
        brightness = 1,
        orientation = 'up',
        onInitialized,
        onChangeDevice,
        style = { flex: 1 }
    }: CameraViewProps 
) {

    const nativeRef = useRef<NativeCamera | null>(null)
    
    // 释放
    useEffect(() => { 
        return () => {
            nativeRef.current?.dispose()
            nativeRef.current = null
        }
    }, [])

    const hybridRef = useNitroCallback(
        useCallback(( ref: NativeCamera | null ) => {
            nativeRef.current = ref
        }, []) 
    )

    const onInitializedCallback = useNitroCallback(
        useCallback(() => onInitialized?.(), [ onInitialized ])
    )

    const onChangeDeviceCallback = useNitroCallback(
        useCallback( (format: CameraFormat) => onChangeDevice?.(format), [ onChangeDevice ]) 
    )

    return (
        <NativeCameraView
            style={ style }
            hybridRef={ hybridRef }
            isActive = { true }
            preview = { preview }
            filter = { filter }
            fps = { fps }
            zoom = { zoom }
            focus = { focus }
            exposure = { exposure }
            brightness = { brightness }
            orientation = { orientation }
            onInitialized = { onInitializedCallback }
            onChangeDevice = {  onChangeDeviceCallback  }
        />
    )
})