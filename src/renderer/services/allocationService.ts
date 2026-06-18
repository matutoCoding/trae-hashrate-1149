import dayjs from 'dayjs';
import type {
  AllocationRequest,
  AllocationResult,
  Instrument,
  InstrumentLoad,
  Reservation
} from '@shared/types';
import {
  mockInstruments,
  mockInstrumentModels,
  mockReservations,
  mockQualifications
} from './mockData';
import { calculateFeeByModelId } from './billingService';

export function checkUserQualification(
  userId: string,
  qualificationType: string
): boolean {
  const now = new Date();
  const qualification = mockQualifications.find(
    q =>
      q.userId === userId &&
      q.type === qualificationType &&
      q.status === 'approved' &&
      new Date(q.expiryDate) > now
  );
  return !!qualification;
}

export function isInstrumentAvailable(
  instrumentId: string,
  startTime: Date,
  endTime: Date,
  excludeReservationId?: string
): boolean {
  const instrument = mockInstruments.find(i => i.id === instrumentId);
  if (!instrument || instrument.status !== 'available') {
    return false;
  }

  const overlapping = mockReservations.find(r => {
    if (excludeReservationId && r.id === excludeReservationId) return false;
    if (r.status === 'cancelled') return false;
    const rStart = new Date(r.startTime);
    const rEnd = new Date(r.endTime);
    const reqStart = new Date(startTime);
    const reqEnd = new Date(endTime);
    return reqStart < rEnd && reqEnd > rStart;
  });

  return !overlapping;
}

export function calculateLoadScore(
  instrumentId: string,
  startTime: Date,
  endTime: Date
): number {
  const instrument = mockInstruments.find(i => i.id === instrumentId);
  if (!instrument) return Infinity;

  const now = new Date();
  const weekAgo = dayjs(now).subtract(7, 'day').toDate();
  const weekLater = dayjs(endTime).add(7, 'day').toDate();

  const relevantReservations = mockReservations.filter(r => {
    if (r.instrumentId !== instrumentId) return false;
    if (r.status === 'cancelled') return false;
    const rStart = new Date(r.startTime);
    const rEnd = new Date(r.endTime);
    return rStart >= weekAgo && rEnd <= weekLater;
  });

  const totalHours = relevantReservations.reduce((sum, r) => {
    const duration = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);

  const designHours = instrument.designDailyHours * 14;
  const loadScore = totalHours / designHours;

  const usageCount = relevantReservations.length;

  return loadScore + usageCount * 0.01;
}

export function getAvailableInstruments(
  modelId: string,
  startTime: Date,
  endTime: Date,
  userId: string
): Array<{ instrument: Instrument; loadScore: number; available: boolean; qualified: boolean }> {
  const model = mockInstrumentModels.find(m => m.id === modelId);
  if (!model) return [];

  const sameModelInstruments = mockInstruments.filter(i => i.modelId === modelId);

  const qualified = checkUserQualification(userId, model.requiredQualificationId);

  return sameModelInstruments.map(instrument => ({
    instrument,
    loadScore: calculateLoadScore(instrument.id, startTime, endTime),
    available: isInstrumentAvailable(instrument.id, startTime, endTime),
    qualified
  }));
}

export function allocateInstrument(request: AllocationRequest): AllocationResult {
  const model = mockInstrumentModels.find(m => m.id === request.modelId);
  if (!model) {
    return { success: false, error: '仪器型号不存在' };
  }

  const qualified = checkUserQualification(request.userId, model.requiredQualificationId);
  if (!qualified) {
    return {
      success: false,
      error: `您没有操作${model.name}的资质，请先申请相关操作资质`
    };
  }

  const durationMinutes =
    (request.endTime.getTime() - request.startTime.getTime()) / (1000 * 60);

  if (durationMinutes < 1) {
    return { success: false, error: '使用时长至少1分钟' };
  }

  const candidates = getAvailableInstruments(
    request.modelId,
    request.startTime,
    request.endTime,
    request.userId
  );

  const availableCandidates = candidates.filter(c => c.available && c.qualified);

  if (availableCandidates.length === 0) {
    return {
      success: false,
      error: '该时段没有可用仪器，请选择其他时间段',
      candidates
    };
  }

  availableCandidates.sort((a, b) => a.loadScore - b.loadScore);

  const selected = availableCandidates[0];
  const feeEstimate = calculateFeeByModelId(durationMinutes, request.modelId);

  const newReservation: Reservation = {
    id: `RES${String(mockReservations.length + 1).padStart(3, '0')}`,
    userId: request.userId,
    instrumentId: selected.instrument.id,
    startTime: request.startTime,
    endTime: request.endTime,
    status: 'pending',
    purpose: request.purpose,
    createdAt: new Date()
  };

  mockReservations.push(newReservation);

  return {
    success: true,
    instrument: selected.instrument,
    reservation: newReservation,
    feeEstimate: feeEstimate || undefined,
    candidates
  };
}

export function getInstrumentLoad(instrumentId: string, days: number = 7): InstrumentLoad {
  const instrument = mockInstruments.find(i => i.id === instrumentId);
  if (!instrument) {
    return {
      instrumentId,
      instrumentName: '未知',
      loadPercentage: 0,
      usedHours: 0,
      totalHours: 0,
      reservationCount: 0
    };
  }

  const now = new Date();
  const startDate = dayjs(now).subtract(days, 'day').toDate();

  const relevantReservations = mockReservations.filter(r => {
    if (r.instrumentId !== instrumentId) return false;
    if (r.status === 'cancelled') return false;
    const rStart = new Date(r.startTime);
    return rStart >= startDate && rStart <= now;
  });

  const usedHours = relevantReservations.reduce((sum, r) => {
    const actualStart = r.actualStartTime || r.startTime;
    const actualEnd = r.actualEndTime || r.endTime;
    const duration = (new Date(actualEnd).getTime() - new Date(actualStart).getTime()) / (1000 * 60 * 60);
    return sum + Math.max(0, duration);
  }, 0);

  const totalHours = instrument.designDailyHours * days;
  const loadPercentage = Math.min(100, (usedHours / totalHours) * 100);

  return {
    instrumentId,
    instrumentName: instrument.name,
    loadPercentage: Math.round(loadPercentage * 10) / 10,
    usedHours: Math.round(usedHours * 10) / 10,
    totalHours,
    reservationCount: relevantReservations.length
  };
}

export function getAllInstrumentLoads(days: number = 7): InstrumentLoad[] {
  return mockInstruments.map(i => getInstrumentLoad(i.id, days));
}
