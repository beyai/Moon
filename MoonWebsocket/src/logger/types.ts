export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

// 日志级别对应的数值，用于过滤
export const LogLevelValue: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

export interface LoggerFactoryOptions {
  /** 日志级别，低于该级别的日志将不会被输出 */
  level?: LogLevel;
  /** 应用名称，用于生产环境日志文件名前缀 */
  appName?: string;
  /** 生产环境日志文件存放目录 */
  logPath?: string;
}