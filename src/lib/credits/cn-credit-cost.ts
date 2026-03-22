/**
 * CN credits consumption per generate-package call.
 * normal: 1 · pro 策略字段: 2 · publishFullPack: 3
 */

export function cnCreditCostForGeneration(publishFullPack: boolean): number {
  if (publishFullPack) return 3;
  return 2;
}
