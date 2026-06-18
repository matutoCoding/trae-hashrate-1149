import type { BillingRule, FeeCalculationResult } from '@shared/types';
import { mockBillingRules } from './mockData';

export function calculateFee(
  actualDurationMinutes: number,
  rule: BillingRule
): FeeCalculationResult {
  const roundedMinutes = Math.ceil(actualDurationMinutes);
  const ratePerMinute = rule.ratePerHour / 60;

  let billableMinutes: number;
  let baseFee: number;
  let usageFee: number;
  let capDiscount: number;

  if (roundedMinutes < rule.baseMinutes) {
    billableMinutes = rule.baseMinutes;
    baseFee = rule.baseFee;
    usageFee = 0;
    capDiscount = 0;
  } else if (roundedMinutes <= rule.capMinutes) {
    billableMinutes = roundedMinutes;
    baseFee = rule.baseFee;
    usageFee = (roundedMinutes - rule.baseMinutes) * ratePerMinute;
    capDiscount = 0;
  } else {
    billableMinutes = rule.capMinutes;
    baseFee = rule.baseFee;
    usageFee = (rule.capMinutes - rule.baseMinutes) * ratePerMinute;
    const actualFee = roundedMinutes * ratePerMinute;
    capDiscount = actualFee - rule.capFee;
  }

  return {
    totalFee: Math.round((baseFee + usageFee) * 100) / 100,
    baseFee: Math.round(baseFee * 100) / 100,
    usageFee: Math.round(usageFee * 100) / 100,
    capDiscount: Math.round(capDiscount * 100) / 100,
    billableMinutes,
    actualMinutes: roundedMinutes,
    ratePerHour: rule.ratePerHour,
    baseMinutes: rule.baseMinutes,
    capMinutes: rule.capMinutes
  };
}

export function calculateFeeByModelId(
  actualDurationMinutes: number,
  modelId: string
): FeeCalculationResult | null {
  const rule = getBillingRule(modelId);
  if (!rule) return null;
  return calculateFee(actualDurationMinutes, rule);
}

export function getBillingRule(modelId: string): BillingRule | undefined {
  return mockBillingRules.find(r => r.modelId === modelId);
}

export function getAllBillingRules(): BillingRule[] {
  return [...mockBillingRules];
}

export function updateBillingRule(rule: BillingRule): BillingRule {
  const index = mockBillingRules.findIndex(r => r.id === rule.id);
  if (index !== -1) {
    mockBillingRules[index] = rule;
  }
  return rule;
}

export function calculateProRatedFee(
  reservationDurations: Array<{ reservationId: string; durationMinutes: number }>,
  totalAmount: number
): Map<string, number> {
  const totalMinutes = reservationDurations.reduce((sum, r) => sum + r.durationMinutes, 0);
  const result = new Map<string, number>();

  reservationDurations.forEach(r => {
    const share = (r.durationMinutes / totalMinutes) * totalAmount;
    result.set(r.reservationId, Math.round(share * 100) / 100);
  });

  return result;
}
