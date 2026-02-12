import type { HybridView, HybridViewProps, HybridViewMethods } from 'react-native-nitro-modules'

// 机机位置
export type CameraPosition = 'back' | 'front'
// 相机方赂
export type CameraOrientation = 'up' | 'left' | 'down' | 'right'

// 相机格式筛选
export interface CameraFilter {
    width: number;
    height: number;
    maxFps: number;
    position: CameraPosition;
}

// 相机当前格式
export interface CameraFormat {
    name: string;
    uniqueID: string;
    deviceType: string;
    position: string;
    width: number;
    height: number;
    minFps: number;
    maxFps: number;
    isWideColorSupported: boolean;
    isVideoHDRSupported: boolean;
    supportsDepthCapture: boolean;
    minExposureDuration: number;
    maxExposureDuration: number;
    minExposureTargetBias: number;
    maxExposureTargetBias: number;
    minZoom: number;
    maxZoom: number;
    minISO: number;
    maxISO: number;
}

export interface CameraProps extends HybridViewProps {
    isActive: boolean;
    preview: boolean;
    filter: CameraFilter;
    fps: number;
    zoom: number;
    focus: number;
    exposure: number;
    brightness: number;
    orientation: CameraOrientation
    onInitialized?: () => void;
    onChangeDevice?: (format: CameraFormat) => void
}

export interface CameraMethods extends HybridViewMethods {
}

export type Camera = HybridView<CameraProps, CameraMethods, { ios: 'swift' }>