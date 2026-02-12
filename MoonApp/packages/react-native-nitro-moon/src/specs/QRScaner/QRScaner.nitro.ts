import type { HybridView, HybridViewProps, HybridViewMethods } from 'react-native-nitro-modules'

export interface QRScanerProps extends HybridViewProps {
    isActive: boolean;
    paused: boolean;
    onScan?: (result: string) => void;
}

export interface QRScanerMethods extends HybridViewMethods {
}

export type QRScaner = HybridView<QRScanerProps, QRScanerMethods, { ios: 'swift' }>