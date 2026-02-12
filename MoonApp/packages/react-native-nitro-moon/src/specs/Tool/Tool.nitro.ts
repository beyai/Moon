import type { HybridObject } from 'react-native-nitro-modules'

export type CameraPermissionStatus = 'notDetermined' | 'authorized' | 'denied' | 'restricted' | 'unknown' 

type BatteryListener = (value: number) => void
type ScreenCaptureListener = (state: boolean) => void
type removeListener = () => void

export interface Tool extends HybridObject<{ ios: 'swift' }> {

    /** 获取App版本号 */
    getVersion(): string;

    /** 获取设备唯一标识 */
    getDeviceUID(): string;
    
    /** 获取设备码 */
    getDeviceCode(): string;

    /** 设置设备状态 */
    setDeviceStatus(state: boolean): void;

    /** 获取相机权限状态 */
    getCameraPermissionStatus(): CameraPermissionStatus;

    /** 请求相机权限 */
    requestCameraPermission(): Promise<CameraPermissionStatus>;

    /** 获取电量 */
    getBattery(): Promise<number>;

    /** 获取屏幕捕获状态 */
    getScreenCaptureStatus(): Promise<boolean>;

    /** 获取屏幕亮度 */
    getBrightness(): Promise<number>;

    /** 设置屏幕亮度 */
    setBrightness(brightness: number): void;  

    /** 重置屏幕亮度 */
    restoreBrightness(): void;

    /** 设置自动熄屏 */
    setIdleTimeDisabled(disabled: boolean): void;

    /** 监听电量变化 */
    onBatteryChange(listener: BatteryListener): removeListener;

    /** 监听屏幕捕获状态变化 */
    onScreenCaptureStateChange(listener: ScreenCaptureListener): removeListener;

}