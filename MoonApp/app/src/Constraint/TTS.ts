enum VoiceLanguage {
    "zh-CN" = '普通话',
    "zh-TW" = '普通话',
    "yue-HK" = '粤语',
}

namespace VoiceLanguage {
    
    export function getLabel(language: string): string {
        const map = VoiceLanguage as unknown as Record<string,string>;
        return map[language] ?? "未知";
    }
}

export { VoiceLanguage }