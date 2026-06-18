import dayjs from 'dayjs';
import type {
  User,
  InstrumentModel,
  Instrument,
  Reservation,
  BillingRule,
  Bill,
  Qualification
} from '@shared/types';

export const mockUsers: User[] = [
  { id: '1', employeeId: 'R2024001', name: '张科研', role: 'researcher', department: '物理系' },
  { id: '2', employeeId: 'R2024002', name: '李教授', role: 'researcher', department: '化学系' },
  { id: '3', employeeId: 'R2024003', name: '王博士', role: 'researcher', department: '材料学院' },
  { id: '4', employeeId: 'A2024001', name: '赵管理员', role: 'admin', department: '设备处' },
  { id: '5', employeeId: 'F2024001', name: '孙财务', role: 'finance', department: '财务处' }
];

export const mockInstrumentModels: InstrumentModel[] = [
  {
    id: 'M1',
    name: '透射电子显微镜',
    description: '高分辨率透射电子显微镜，用于材料微观结构分析',
    requiredQualificationId: 'Q1'
  },
  {
    id: 'M2',
    name: 'X射线衍射仪',
    description: 'X射线衍射仪，用于晶体结构分析和物相鉴定',
    requiredQualificationId: 'Q2'
  },
  {
    id: 'M3',
    name: '核磁共振仪',
    description: '400MHz核磁共振波谱仪，用于有机化合物结构分析',
    requiredQualificationId: 'Q3'
  },
  {
    id: 'M4',
    name: '扫描电子显微镜',
    description: '场发射扫描电子显微镜，用于表面形貌观察',
    requiredQualificationId: 'Q1'
  }
];

export const mockInstruments: Instrument[] = [
  { id: 'I1', modelId: 'M1', name: 'TEM-01', serialNumber: 'SN2023001', location: 'A座101室', status: 'available', designDailyHours: 8 },
  { id: 'I2', modelId: 'M1', name: 'TEM-02', serialNumber: 'SN2023002', location: 'A座101室', status: 'available', designDailyHours: 8 },
  { id: 'I3', modelId: 'M1', name: 'TEM-03', serialNumber: 'SN2023003', location: 'A座102室', status: 'available', designDailyHours: 8 },
  { id: 'I4', modelId: 'M2', name: 'XRD-01', serialNumber: 'SN2023004', location: 'B座201室', status: 'available', designDailyHours: 12 },
  { id: 'I5', modelId: 'M2', name: 'XRD-02', serialNumber: 'SN2023005', location: 'B座201室', status: 'available', designDailyHours: 12 },
  { id: 'I6', modelId: 'M3', name: 'NMR-01', serialNumber: 'SN2023006', location: 'C座301室', status: 'available', designDailyHours: 16 },
  { id: 'I7', modelId: 'M4', name: 'SEM-01', serialNumber: 'SN2023007', location: 'A座103室', status: 'maintenance', designDailyHours: 10 },
  { id: 'I8', modelId: 'M4', name: 'SEM-02', serialNumber: 'SN2023008', location: 'A座103室', status: 'available', designDailyHours: 10 }
];

export const mockBillingRules: BillingRule[] = [
  { id: 'BR1', modelId: 'M1', ratePerHour: 300, baseMinutes: 30, capMinutes: 480, baseFee: 150, capFee: 2400 },
  { id: 'BR2', modelId: 'M2', ratePerHour: 150, baseMinutes: 15, capMinutes: 720, baseFee: 37.5, capFee: 1800 },
  { id: 'BR3', modelId: 'M3', ratePerHour: 500, baseMinutes: 60, capMinutes: 960, baseFee: 500, capFee: 8000 },
  { id: 'BR4', modelId: 'M4', ratePerHour: 200, baseMinutes: 20, capMinutes: 600, baseFee: 66.67, capFee: 2000 }
];

const now = dayjs();

export const mockReservations: Reservation[] = [
  {
    id: 'RES001',
    userId: '1',
    instrumentId: 'I1',
    startTime: now.add(1, 'day').hour(9).minute(0).toDate(),
    endTime: now.add(1, 'day').hour(11).minute(0).toDate(),
    status: 'confirmed',
    purpose: '纳米材料形貌表征',
    createdAt: now.subtract(2, 'day').toDate()
  },
  {
    id: 'RES002',
    userId: '1',
    instrumentId: 'I4',
    startTime: now.add(1, 'day').hour(14).minute(0).toDate(),
    endTime: now.add(1, 'day').hour(16).minute(30).toDate(),
    status: 'confirmed',
    purpose: '晶体结构分析',
    createdAt: now.subtract(1, 'day').toDate()
  },
  {
    id: 'RES003',
    userId: '2',
    instrumentId: 'I2',
    startTime: now.add(2, 'day').hour(10).minute(0).toDate(),
    endTime: now.add(2, 'day').hour(15).minute(0).toDate(),
    status: 'pending',
    purpose: '催化剂表面分析',
    createdAt: now.subtract(1, 'day').toDate()
  },
  {
    id: 'RES004',
    userId: '3',
    instrumentId: 'I6',
    startTime: now.subtract(1, 'day').hour(8).minute(0).toDate(),
    endTime: now.subtract(1, 'day').hour(12).minute(0).toDate(),
    actualStartTime: now.subtract(1, 'day').hour(8).minute(5).toDate(),
    actualEndTime: now.subtract(1, 'day').hour(11).minute(50).toDate(),
    status: 'completed',
    purpose: '有机化合物结构鉴定',
    createdAt: now.subtract(3, 'day').toDate()
  },
  {
    id: 'RES005',
    userId: '1',
    instrumentId: 'I1',
    startTime: now.subtract(2, 'day').hour(9).minute(0).toDate(),
    endTime: now.subtract(2, 'day').hour(10).minute(0).toDate(),
    actualStartTime: now.subtract(2, 'day').hour(9).minute(0).toDate(),
    actualEndTime: now.subtract(2, 'day').hour(9).minute(12).toDate(),
    status: 'completed',
    purpose: '快速形貌检测',
    createdAt: now.subtract(4, 'day').toDate()
  },
  {
    id: 'RES006',
    userId: '2',
    instrumentId: 'I6',
    startTime: now.add(3, 'day').hour(9).minute(0).toDate(),
    endTime: now.add(4, 'day').hour(18).minute(0).toDate(),
    status: 'confirmed',
    purpose: '长时间连续测试',
    createdAt: now.toDate()
  },
  {
    id: 'RES007',
    userId: '3',
    instrumentId: 'I5',
    startTime: now.add(1, 'day').hour(8).minute(0).toDate(),
    endTime: now.add(1, 'day').hour(20).minute(0).toDate(),
    status: 'pending',
    purpose: '全天实验',
    createdAt: now.toDate()
  }
];

export const mockBills: Bill[] = [
  {
    id: 'BILL001',
    reservationId: 'RES004',
    userId: '3',
    totalAmount: 1966.67,
    baseFee: 500,
    usageFee: 1466.67,
    capDiscount: 0,
    billableMinutes: 285,
    actualMinutes: 285,
    status: 'pending',
    generatedAt: now.subtract(1, 'day').toDate()
  },
  {
    id: 'BILL002',
    reservationId: 'RES005',
    userId: '1',
    totalAmount: 150,
    baseFee: 150,
    usageFee: 0,
    capDiscount: 0,
    billableMinutes: 30,
    actualMinutes: 12,
    status: 'paid',
    generatedAt: now.subtract(2, 'day').toDate(),
    paidAt: now.subtract(1, 'day').toDate()
  }
];

export const mockQualifications: Qualification[] = [
  {
    id: 'QUAL001',
    userId: '1',
    type: 'Q1',
    typeName: '电子显微镜操作资质',
    certificateNumber: 'TEM-2023-001',
    issueDate: now.subtract(6, 'month').toDate(),
    expiryDate: now.add(6, 'month').toDate(),
    status: 'approved'
  },
  {
    id: 'QUAL002',
    userId: '1',
    type: 'Q2',
    typeName: 'X射线衍射仪操作资质',
    certificateNumber: 'XRD-2023-001',
    issueDate: now.subtract(8, 'month').toDate(),
    expiryDate: now.add(4, 'month').toDate(),
    status: 'approved'
  },
  {
    id: 'QUAL003',
    userId: '2',
    type: 'Q1',
    typeName: '电子显微镜操作资质',
    certificateNumber: 'TEM-2023-002',
    issueDate: now.subtract(10, 'month').toDate(),
    expiryDate: now.add(2, 'month').toDate(),
    status: 'approved'
  },
  {
    id: 'QUAL004',
    userId: '2',
    type: 'Q3',
    typeName: '核磁共振仪操作资质',
    certificateNumber: 'NMR-2023-001',
    issueDate: now.subtract(3, 'month').toDate(),
    expiryDate: now.add(9, 'month').toDate(),
    status: 'approved'
  },
  {
    id: 'QUAL005',
    userId: '3',
    type: 'Q3',
    typeName: '核磁共振仪操作资质',
    certificateNumber: 'NMR-2023-002',
    issueDate: now.subtract(1, 'month').toDate(),
    expiryDate: now.add(11, 'month').toDate(),
    status: 'approved'
  },
  {
    id: 'QUAL006',
    userId: '3',
    type: 'Q2',
    typeName: 'X射线衍射仪操作资质',
    certificateNumber: 'XRD-2023-002',
    issueDate: now.subtract(2, 'week').toDate(),
    expiryDate: now.add(23, 'month').toDate(),
    status: 'pending'
  }
];
