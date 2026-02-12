import React, { useCallback, useEffect, useRef} from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { getHostComponent } from 'react-native-nitro-modules'
import CameraConfig from '../../nitrogen/generated/shared/json/QRScanerConfig.json'
import { useNitroCallback } from '../hook/useNitroCallback'
import type { QRScaner as NativeQRScaner, QRScanerProps, QRScanerMethods } from '../specs/QRScaner/QRScaner.nitro'

const NativeQRScanView = getHostComponent<QRScanerProps, QRScanerMethods>('NativeQRScanView', () => CameraConfig )

interface QRScanViewProps extends Omit<QRScanerProps, 'isActive'>  {
    style?: StyleProp<ViewStyle>
}

export const QRScaner = React.memo(function CameraView(
    {
        paused = false,
        style = { flex: 1 },
        onScan,
    }: QRScanViewProps 
) {

    const nativeRef = useRef<NativeQRScaner | null>(null)
    
    // 释放
    useEffect(() => { 
        return () => {
            nativeRef.current?.dispose()
            nativeRef.current = null
        }
    }, [])

    const hybridRef = useNitroCallback(
        useCallback(( ref: NativeQRScaner | null ) => {
            nativeRef.current = ref
        }, []) 
    )

    const onScanCallback = useNitroCallback(
        useCallback((result: string) => onScan?.(result), [ onScan ])
    )

    return (
        <NativeQRScanView
            style       = { style }
            hybridRef   = { hybridRef }
            isActive    = { true }
            paused      = { paused }
            onScan      = { onScanCallback }
        />
    )
})