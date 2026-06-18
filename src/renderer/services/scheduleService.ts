import dayjs from 'dayjs';
import type {
  Instrument,
  InstrumentModel,
  InstrumentStatus,
  Reservation,
  DashboardStats
} from '@shared/types';
import {
  mockInstruments,
  mockInstrumentModels,
  mockReservations,
  mockBills
} from './mockData';

export interface InstrumentFilter {
  modelId?: string;
  status?: string;
  location?: string;
}

export function getInstruments(filter?: InstrumentFilter): Instrument[] {
  let result = [...mockInstruments];

  if (filter?.modelId) {
    result = result.filter(i => i.modelId === filter.modelId);
  }
  if (filter?.status) {
    result = result.filter(i => i.status === filter.status as InstrumentStatus);
  }
  if (filter?.location) {
    result = result.filter(i => i.location.includes(filter.location!));
  }

  return result;
}

export function getInstrumentById(id: string): Instrument | undefined {
  return mockInstruments.find(i => i.id === id);
}

export function getInstrumentModels(): InstrumentModel[] {
  return [...mockInstrumentModels];
}

export function getInstrumentModelById(id: string): InstrumentModel | undefined {
  return mockInstrumentModels.find(m => m.id === id);
}

export function getInstrumentSchedule(
  instrumentId: string,
  startDate: Date,
  endDate: Date
): Reservation[] {
  return mockReservations.filter(r => {
    if (r.instrumentId !== instrumentId) return false;
    if (r.status === 'cancelled') return false;
    const rStart = new Date(r.startTime);
    const rEnd = new Date(r.endTime);
    return rStart <= endDate && rEnd >= startDate;
  });
}

export function getReservationsByDate(date: Date): Reservation[] {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();

  return mockReservations.filter(r => {
    if (r.status === 'cancelled') return false;
    const rStart = new Date(r.startTime);
    const rEnd = new Date(r.endTime);
    return rStart <= endOfDay && rEnd >= startOfDay;
  });
}

export function getReservationsByUser(userId: string): Reservation[] {
  return mockReservations
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

export function getReservationById(id: string): Reservation | undefined {
  return mockReservations.find(r => r.id === id);
}

export function updateReservationStatus(
  id: string,
  status: Reservation['status']
): Reservation | null {
  const reservation = mockReservations.find(r => r.id === id);
  if (!reservation) return null;

  reservation.status = status;

  if (status === 'in-progress' && !reservation.actualStartTime) {
    reservation.actualStartTime = new Date();
  }
  if (status === 'completed' && !reservation.actualEndTime) {
    reservation.actualEndTime = new Date();
  }

  return reservation;
}

export function cancelReservation(id: string): boolean {
  const reservation = mockReservations.find(r => r.id === id);
  if (!reservation) return false;

  reservation.status = 'cancelled';
  return true;
}

export function getDashboardStats(): DashboardStats {
  const now = new Date();
  const startOfDay = dayjs(now).startOf('day').toDate();
  const endOfDay = dayjs(now).endOf('day').toDate();
  const startOfMonth = dayjs(now).startOf('month').toDate();

  const totalInstruments = mockInstruments.length;
  const availableInstruments = mockInstruments.filter(
    i => i.status === 'available'
  ).length;

  const todayReservations = mockReservations.filter(r => {
    const rStart = new Date(r.startTime);
    return rStart >= startOfDay && rStart <= endOfDay && r.status !== 'cancelled';
  }).length;

  const pendingReservations = mockReservations.filter(
    r => r.status === 'pending'
  ).length;

  const monthRevenue = mockBills
    .filter(b => {
      const generatedAt = new Date(b.generatedAt);
      return generatedAt >= startOfMonth && b.status !== 'cancelled';
    })
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const totalHours = mockInstruments.reduce(
    (sum, i) => sum + i.designDailyHours * 30,
    0
  );
  const usedHours = mockReservations
    .filter(r => {
      const rStart = new Date(r.startTime);
      return rStart >= startOfMonth && r.status !== 'cancelled';
    })
    .reduce((sum, r) => {
      const duration =
        (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) /
        (1000 * 60 * 60);
      return sum + duration;
    }, 0);

  const averageUtilization = totalHours > 0 ? (usedHours / totalHours) * 100 : 0;

  return {
    totalInstruments,
    availableInstruments,
    todayReservations,
    monthRevenue: Math.round(monthRevenue * 100) / 100,
    averageUtilization: Math.round(averageUtilization * 10) / 10,
    pendingReservations
  };
}

export function createInstrument(
  instrument: Omit<Instrument, 'id'>
): Instrument {
  const newInstrument: Instrument = {
    ...instrument,
    id: `I${mockInstruments.length + 1}`
  };
  mockInstruments.push(newInstrument);
  return newInstrument;
}

export function updateInstrument(instrument: Instrument): Instrument | null {
  const index = mockInstruments.findIndex(i => i.id === instrument.id);
  if (index === -1) return null;
  mockInstruments[index] = instrument;
  return instrument;
}
