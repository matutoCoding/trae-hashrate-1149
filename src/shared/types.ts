export type UserRole = 'researcher' | 'admin' | 'finance';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  role: UserRole;
  department: string;
  passwordHash?: string;
}

export interface InstrumentModel {
  id: string;
  name: string;
  description: string;
  requiredQualificationId: string;
}

export type InstrumentStatus = 'available' | 'in-use' | 'maintenance' | 'offline';

export interface Instrument {
  id: string;
  modelId: string;
  name: string;
  serialNumber: string;
  location: string;
  status: InstrumentStatus;
  designDailyHours: number;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';

export interface Reservation {
  id: string;
  userId: string;
  instrumentId: string;
  startTime: Date;
  endTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: ReservationStatus;
  purpose: string;
  createdAt: Date;
}

export interface BillingRule {
  id: string;
  modelId: string;
  ratePerHour: number;
  baseMinutes: number;
  capMinutes: number;
  baseFee: number;
  capFee: number;
}

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Bill {
  id: string;
  reservationId: string;
  userId: string;
  totalAmount: number;
  baseFee: number;
  usageFee: number;
  capDiscount: number;
  billableMinutes: number;
  actualMinutes: number;
  status: BillStatus;
  generatedAt: Date;
  paidAt?: Date;
}

export type QualificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface Qualification {
  id: string;
  userId: string;
  type: string;
  typeName: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  status: QualificationStatus;
  documentUrl?: string;
}

export interface FeeCalculationResult {
  totalFee: number;
  baseFee: number;
  usageFee: number;
  capDiscount: number;
  billableMinutes: number;
  actualMinutes: number;
  ratePerHour: number;
  baseMinutes: number;
  capMinutes: number;
}

export interface AllocationRequest {
  modelId: string;
  startTime: Date;
  endTime: Date;
  userId: string;
  purpose: string;
}

export interface AllocationResult {
  success: boolean;
  instrument?: Instrument;
  reservation?: Reservation;
  feeEstimate?: FeeCalculationResult;
  error?: string;
  candidates?: Array<{
    instrument: Instrument;
    loadScore: number;
    available: boolean;
  }>;
}

export interface InstrumentLoad {
  instrumentId: string;
  instrumentName: string;
  loadPercentage: number;
  usedHours: number;
  totalHours: number;
  reservationCount: number;
}

export interface DashboardStats {
  totalInstruments: number;
  availableInstruments: number;
  todayReservations: number;
  monthRevenue: number;
  averageUtilization: number;
  pendingReservations: number;
}
