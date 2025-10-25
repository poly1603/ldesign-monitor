/**
 * @ldesign/monitor - 配置管理
 */

export { ConfigValidator, ConfigValidationError } from './ConfigValidator'
export {
  applyPreset,
  mergePresets,
  presets,
  developmentPreset,
  productionPreset,
  testPreset,
  performanceFirstPreset,
  fullMonitoringPreset,
  errorOnlyPreset,
  type PresetName,
} from './ConfigPresets'

