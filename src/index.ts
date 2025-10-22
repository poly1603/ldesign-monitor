/**
 * @ldesign/monitor - 监控系统
 */
export class Monitor {
  trackPerformance(metric: string, value: number) { console.info(`Performance: ${metric} = ${value}`) }
  trackError(error: Error) { console.error('Error tracked:', error) }
}
export function createMonitor() { return new Monitor() }

