import type { HybridObject } from 'react-native-nitro-modules'

/** 矩形框 */
type DetectionLabelRect = number[];

/** 检测标签 */
export interface DetectLabel {
    /** 标签 */
    label: string;
    /** 置信度 */
    confidence: number;
    /** 矩形框: - x,y,w,h 分别表示矩形框的左上角坐标和宽度高度  */
    rect: DetectionLabelRect;
}

/** 检测结果 */
export interface DetectionResult {
    /** 时间戳 */
    timestamp: number;
    /** 检测标签 */
    data: DetectLabel[]
}

type RemoveListener = () => void;

export interface Detection extends HybridObject<{ ios: 'swift' }> {
    /** 模型名 */
    readonly modelName?: string;
    /** 置信度阈值 */
    confidenceThreshold: number;
    /** 交并比阈值 */
    iouThreshold: number;
    /** 是否启用模糊检测 */
    enableBlurDetection: boolean;
    /** 模糊检测置信度阈值 */
    blurConfidenceThreshold: number;
    /** 模糊检测分数阈值 */
    blurScoreThreshold: number;
    /** 加载模型 */
    load(model: string): Promise<void>;
    /** 卸载模型 */
    unload(): void;
    /** 接收检测结果 */
    onDetectResult(listener: (results: DetectionResult) => void): RemoveListener;
}