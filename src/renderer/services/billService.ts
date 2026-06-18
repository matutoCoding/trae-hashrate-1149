import dayjs from 'dayjs';
import type { Bill, BillStatus, FeeCalculationResult } from '@shared/types';
import { mockBills, mockReservations, mockInstruments, mockInstrumentModels } from './mockData';
import { calculateFeeByModelId, getBillingRule } from './billingService';

export interface BillFilter {
  userId?: string;
  status?: BillStatus;
  startDate?: Date;
  endDate?: Date;
}

export function generateBill(reservationId: string): Bill | null {
  const reservation = mockReservations.find(r => r.id === reservationId);
  if (!reservation) return null;

  const existingBill = mockBills.find(b => b.reservationId === reservationId);
  if (existingBill) return existingBill;

  const actualStart = reservation.actualStartTime || reservation.startTime;
  const actualEnd = reservation.actualEndTime || reservation.endTime;
  const actualDurationMinutes =
    (new Date(actualEnd).getTime() - new Date(actualStart).getTime()) / (1000 * 60);

  const instrument = mockInstruments.find(i => i.id === reservation.instrumentId);
  if (!instrument) return null;

  const feeResult = calculateFeeByModelId(actualDurationMinutes, instrument.modelId);
  if (!feeResult) return null;

  const newBill: Bill = {
    id: `BILL${String(mockBills.length + 1).padStart(3, '0')}`,
    reservationId,
    userId: reservation.userId,
    totalAmount: feeResult.totalFee,
    baseFee: feeResult.baseFee,
    usageFee: feeResult.usageFee,
    capDiscount: feeResult.capDiscount,
    billableMinutes: feeResult.billableMinutes,
    actualMinutes: feeResult.actualMinutes,
    status: 'pending',
    generatedAt: new Date()
  };

  mockBills.push(newBill);
  return newBill;
}

export function getBills(filter?: BillFilter): Bill[] {
  let result = [...mockBills];

  if (filter?.userId) {
    result = result.filter(b => b.userId === filter.userId);
  }
  if (filter?.status) {
    result = result.filter(b => b.status === filter.status);
  }
  if (filter?.startDate) {
    result = result.filter(b => new Date(b.generatedAt) >= filter.startDate!);
  }
  if (filter?.endDate) {
    result = result.filter(b => new Date(b.generatedAt) <= filter.endDate!);
  }

  return result.sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
}

export function getBillById(id: string): Bill | undefined {
  return mockBills.find(b => b.id === id);
}

export interface BillDetail extends Bill {
  reservation?: {
    id: string;
    instrumentName: string;
    instrumentModel: string;
    startTime: Date;
    endTime: Date;
    actualStartTime?: Date;
    actualEndTime?: Date;
    purpose: string;
  };
  feeBreakdown: FeeCalculationResult;
}

export function getBillDetail(billId: string): BillDetail | null {
  const bill = mockBills.find(b => b.id === billId);
  if (!bill) return null;

  const reservation = mockReservations.find(r => r.id === bill.reservationId);
  if (!reservation) return null;

  const instrument = mockInstruments.find(i => i.id === reservation.instrumentId);
  const model = instrument ? mockInstrumentModels.find(m => m.id === instrument.modelId) : null;
  const billingRule = instrument ? getBillingRule(instrument.modelId) : undefined;

  const feeBreakdown: FeeCalculationResult = {
    totalFee: bill.totalAmount,
    baseFee: bill.baseFee,
    usageFee: bill.usageFee,
    capDiscount: bill.capDiscount,
    billableMinutes: bill.billableMinutes,
    actualMinutes: bill.actualMinutes,
    ratePerHour: billingRule?.ratePerHour ?? 0,
    baseMinutes: billingRule?.baseMinutes ?? 0,
    capMinutes: billingRule?.capMinutes ?? 0
  };

  return {
    ...bill,
    reservation: {
      id: reservation.id,
      instrumentName: instrument?.name || '未知',
      instrumentModel: model?.name || '未知',
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      actualStartTime: reservation.actualStartTime,
      actualEndTime: reservation.actualEndTime,
      purpose: reservation.purpose
    },
    feeBreakdown
  };
}

export function updateBillStatus(
  billId: string,
  status: BillStatus
): Bill | null {
  const bill = mockBills.find(b => b.id === billId);
  if (!bill) return null;

  bill.status = status;
  if (status === 'paid' && !bill.paidAt) {
    bill.paidAt = new Date();
  }

  return bill;
}

export function exportBill(billId: string, format: 'csv' | 'text'): string {
  const detail = getBillDetail(billId);
  if (!detail) return '';

  const formatDate = (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss');
  const formatMoney = (amount: number) => `¥${amount.toFixed(2)}`;

  if (format === 'csv') {
    const headers = [
      '账单编号',
      '预约编号',
      '仪器名称',
      '使用用途',
      '预约开始时间',
      '预约结束时间',
      '实际开始时间',
      '实际结束时间',
      '实际时长(分钟)',
      '计费时长(分钟)',
      '起步费',
      '使用费',
      '封顶优惠',
      '总金额',
      '账单状态',
      '生成时间'
    ];

    const values = [
      detail.id,
      detail.reservation?.id || '',
      detail.reservation?.instrumentName || '',
      detail.reservation?.purpose || '',
      formatDate(detail.reservation?.startTime || new Date()),
      formatDate(detail.reservation?.endTime || new Date()),
      detail.reservation?.actualStartTime
        ? formatDate(detail.reservation.actualStartTime)
        : '',
      detail.reservation?.actualEndTime
        ? formatDate(detail.reservation.actualEndTime)
        : '',
      detail.actualMinutes,
      detail.billableMinutes,
      detail.baseFee,
      detail.usageFee,
      detail.capDiscount,
      detail.totalAmount,
      detail.status,
      formatDate(detail.generatedAt)
    ];

    return [headers.join(','), values.join(',')].join('\n');
  } else {
    return `
========================================
          高校科研仪器共享平台
              收费账单
========================================

账单编号: ${detail.id}
生成时间: ${formatDate(detail.generatedAt)}
账单状态: ${getStatusText(detail.status)}

----------------------------------------
预约信息:
  预约编号: ${detail.reservation?.id || ''}
  仪器名称: ${detail.reservation?.instrumentName || ''}
  使用用途: ${detail.reservation?.purpose || ''}
  预约时间: ${formatDate(detail.reservation?.startTime || new Date())} 
          至 ${formatDate(detail.reservation?.endTime || new Date())}
  实际使用: ${
    detail.reservation?.actualStartTime
      ? formatDate(detail.reservation.actualStartTime)
      : '未开始'
  } 
          至 ${
            detail.reservation?.actualEndTime
              ? formatDate(detail.reservation.actualEndTime)
              : '未结束'
          }

----------------------------------------
费用明细:
  实际使用时长: ${detail.actualMinutes} 分钟
  计费时长: ${detail.billableMinutes} 分钟
  起步费: ${formatMoney(detail.baseFee)}
  使用费: ${formatMoney(detail.usageFee)}
  ${detail.capDiscount > 0 ? `封顶优惠: -${formatMoney(detail.capDiscount)}\n` : ''}
----------------------------------------
应收金额: ${formatMoney(detail.totalAmount)}
========================================
`;
  }
}

function getStatusText(status: BillStatus): string {
  const statusMap: Record<BillStatus, string> = {
    pending: '待支付',
    paid: '已支付',
    overdue: '已逾期',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
}

export function getBillsSummary(userId?: string) {
  const bills = userId ? getBills({ userId }) : getBills();

  const totalAmount = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const paidAmount = bills
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingAmount = bills
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return {
    totalCount: bills.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
    paidAmount: Math.round(paidAmount * 100) / 100,
    pendingAmount: Math.round(pendingAmount * 100) / 100,
    unpaidCount: bills.filter(b => b.status === 'pending' || b.status === 'overdue')
      .length
  };
}
