import dayjs from 'dayjs';
import type {
  ReservationStatus,
  BillStatus,
  InstrumentStatus,
  QualificationStatus
} from '@shared/types';

export function formatDateTime(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

export function formatDate(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatTime(date: Date | string): string {
  return dayjs(date).format('HH:mm');
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
  }
  return `${mins}分钟`;
}

export function formatMoney(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    available: 'success',
    'in-use': 'processing',
    maintenance: 'warning',
    offline: 'default',
    pending: 'warning',
    confirmed: 'processing',
    'in-progress': 'processing',
    completed: 'success',
    cancelled: 'default',
    paid: 'success',
    overdue: 'error',
    approved: 'success',
    rejected: 'error',
    expired: 'default'
  };
  return colorMap[status] || 'default';
}

export function getStatusText(
  status: ReservationStatus | BillStatus | InstrumentStatus | QualificationStatus
): string {
  const textMap: Record<string, string> = {
    available: '可用',
    'in-use': '使用中',
    maintenance: '维护中',
    offline: '离线',
    pending: '待确认',
    confirmed: '已确认',
    'in-progress': '进行中',
    completed: '已完成',
    cancelled: '已取消',
    paid: '已支付',
    overdue: '已逾期',
    approved: '已通过',
    rejected: '已拒绝',
    expired: '已过期'
  };
  return textMap[status] || status;
}

export function getRoleText(role: string): string {
  const roleMap: Record<string, string> = {
    researcher: '科研人员',
    admin: '管理员',
    finance: '财务人员'
  };
  return roleMap[role] || role;
}

export function generateId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
}
