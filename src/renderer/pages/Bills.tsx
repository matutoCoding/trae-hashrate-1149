import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Descriptions,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  message
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getBills, getBillDetail, updateBillStatus, exportBill, generateBill, getBillsSummary } from '../services/billService';
import { getReservationsByUser, getReservationById } from '../services/scheduleService';
import { useAppStore } from '../store/useAppStore';
import { formatDateTime, formatMoney, formatDuration, getStatusColor, getStatusText } from '../utils/format';
import type { Bill, BillStatus } from '@shared/types';
import type { BillDetail } from '../services/billService';
import { mockInstruments, mockUsers } from '../services/mockData';

const { RangePicker } = DatePicker;

export default function Bills() {
  const { currentUser } = useAppStore();
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [statusFilter, setStatusFilter] = useState<BillStatus | ''>('');
  const [detailModal, setDetailModal] = useState<{ visible: boolean; detail?: BillDetail | null }>({ visible: false });
  const [summary, setSummary] = useState<any>(null);
  const [pendingReservations, setPendingReservations] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  useEffect(() => {
    let result = [...bills];
    if (statusFilter) {
      result = result.filter(b => b.status === statusFilter);
    }
    setFilteredBills(result);
  }, [bills, statusFilter]);

  const loadData = () => {
    if (currentUser) {
      const filter = currentUser.role === 'researcher' ? { userId: currentUser.id } : undefined;
      const billsData = getBills(filter);
      setBills(billsData);
      setFilteredBills(billsData);
      setSummary(getBillsSummary(currentUser.role === 'researcher' ? currentUser.id : undefined));
      
      const myReservations = getReservationsByUser(currentUser.id);
      const pending = myReservations.filter(r => 
        r.status === 'completed' && !billsData.find(b => b.reservationId === r.id)
      );
      setPendingReservations(pending);
    }
  };

  const handleGenerateBill = (reservationId: string) => {
    const bill = generateBill(reservationId);
    if (bill) {
      message.success('账单已生成');
      loadData();
    }
  };

  const handleViewDetail = (billId: string) => {
    const detail = getBillDetail(billId);
    setDetailModal({ visible: true, detail });
  };

  const handlePay = (billId: string) => {
    Modal.confirm({
      title: '确认支付',
      content: '确认已收到该笔款项吗？',
      onOk: () => {
        const updated = updateBillStatus(billId, 'paid');
        if (updated) {
          message.success('账单已标记为已支付');
          loadData();
        }
      }
    });
  };

  const handleExport = (billId: string, format: 'csv' | 'text') => {
    const content = exportBill(billId, format);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `账单_${billId}.${format === 'csv' ? 'csv' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('导出成功');
  };

  const columns = [
    {
      title: '账单编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (v: string) => <span className="font-mono text-primary-600">{v}</span>
    },
    {
      title: '预约编号',
      dataIndex: 'reservationId',
      key: 'reservationId',
      width: 120,
      render: (v: string) => <span className="font-mono">{v}</span>
    },
    {
      title: '用户',
      dataIndex: 'userId',
      key: 'userId',
      width: 100,
      render: (v: string) => mockUsers.find(u => u.id === v)?.name || v
    },
    {
      title: '仪器',
      dataIndex: 'reservationId',
      key: 'instrument',
      width: 100,
      render: (v: string) => {
        const res = getReservationById(v);
        const inst = res ? mockInstruments.find(i => i.id === res.instrumentId) : null;
        return inst?.name || '-';
      }
    },
    {
      title: '实际时长',
      dataIndex: 'actualMinutes',
      key: 'actualMinutes',
      width: 100,
      render: (v: number) => formatDuration(v)
    },
    {
      title: '计费时长',
      dataIndex: 'billableMinutes',
      key: 'billableMinutes',
      width: 100,
      render: (v: number, record: Bill) => (
        <div>
          {formatDuration(v)}
          {v !== record.actualMinutes && (
            <Tag color={v > record.actualMinutes ? 'warning' : 'success'} className="ml-1">
              {v > record.actualMinutes ? '起步' : '封顶'}
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '应收金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (v: number) => (
        <span className="font-mono font-bold text-lg text-primary-600">{formatMoney(v)}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: BillStatus) => (
        <Tag color={getStatusColor(v)}>{getStatusText(v)}</Tag>
      )
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      width: 160,
      render: (v: Date) => formatDateTime(v)
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Bill) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            详情
          </Button>
          {record.status === 'pending' && currentUser?.role !== 'researcher' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handlePay(record.id)}
            >
              标记已付
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleExport(record.id, 'text')}
          >
            导出
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="shadow-card border-0 rounded-xl">
            <Statistic
              title="账单总数"
              value={summary?.totalCount || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#165DFF' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-card border-0 rounded-xl">
            <Statistic
              title="已支付金额"
              value={summary?.paidAmount || 0}
              prefix={<CheckCircleOutlined />}
              precision={2}
              valueStyle={{ color: '#00B42A' }}
              formatter={(v) => formatMoney(v as number)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-card border-0 rounded-xl">
            <Statistic
              title="待支付金额"
              value={summary?.pendingAmount || 0}
              prefix={<ClockCircleOutlined />}
              precision={2}
              valueStyle={{ color: '#FF7D00' }}
              formatter={(v) => formatMoney(v as number)}
            />
          </Card>
        </Col>
      </Row>

      {pendingReservations.length > 0 && (
        <Card
          title={
            <Space>
              <ReloadOutlined className="text-warning" />
              待生成账单（已完成的预约）
            </Space>
          }
          className="shadow-card border-0 rounded-xl"
          extra={
            <Button
              type="primary"
              size="small"
              icon={<ReloadOutlined />}
              onClick={loadData}
            >
              刷新
            </Button>
          }
        >
          <Space wrap>
            {pendingReservations.map(r => {
              const inst = mockInstruments.find(i => i.id === r.instrumentId);
              return (
                <Tag
                  key={r.id}
                  color="warning"
                  className="text-sm px-3 py-1 cursor-pointer hover:opacity-80"
                  onClick={() => handleGenerateBill(r.id)}
                >
                  {r.id} - {inst?.name}
                  <Button type="link" size="small" className="ml-2 !p-0">
                    生成账单
                  </Button>
                </Tag>
              );
            })}
          </Space>
        </Card>
      )}

      <Card
        title={
          <Space>
            <FileTextOutlined />
            账单列表
          </Space>
        }
        className="shadow-card border-0 rounded-xl"
        extra={
          <Space>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 150 }}
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              options={[
                { value: 'pending', label: '待支付' },
                { value: 'paid', label: '已支付' },
                { value: 'overdue', label: '已逾期' },
                { value: 'cancelled', label: '已取消' }
              ]}
            />
            <RangePicker
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  let result = [...bills];
                  result = result.filter(b => {
                    const billDate = dayjs(b.generatedAt);
                    return billDate.isAfter(dates[0]) && billDate.isBefore(dates[1]);
                  });
                  setFilteredBills(result);
                } else {
                  setFilteredBills(bills);
                }
              }}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredBills}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title="账单详情"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false })}
        width={700}
        footer={[
          <Space key="actions">
            {detailModal.detail?.status === 'pending' && currentUser?.role !== 'researcher' && (
              <Button
                key="pay"
                type="primary"
                onClick={() => {
                  if (detailModal.detail) {
                    handlePay(detailModal.detail.id);
                    setDetailModal({ visible: false });
                  }
                }}
              >
                标记已支付
              </Button>
            )}
            <Button
              key="export"
              icon={<DownloadOutlined />}
              onClick={() => {
                if (detailModal.detail) {
                  handleExport(detailModal.detail.id, 'text');
                }
              }}
            >
              导出账单
            </Button>
            <Button key="close" onClick={() => setDetailModal({ visible: false })}>
              关闭
            </Button>
          </Space>
        ]}
      >
        {detailModal.detail && (
          <div className="animate-fade-in">
            <Descriptions column={2} bordered size="small" className="mb-4">
              <Descriptions.Item label="账单编号">
                <span className="font-mono font-bold text-primary-600">
                  {detailModal.detail.id}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="账单状态">
                <Tag color={getStatusColor(detailModal.detail.status)}>
                  {getStatusText(detailModal.detail.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="生成时间">
                {formatDateTime(detailModal.detail.generatedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="支付时间">
                {detailModal.detail.paidAt ? formatDateTime(detailModal.detail.paidAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="用户" span={2}>
                {mockUsers.find(u => u.id === detailModal.detail!.userId)?.name}
              </Descriptions.Item>
            </Descriptions>

            <Card
              size="small"
              title="预约信息"
              className="mb-4"
            >
              <Descriptions column={2} size="small">
                <Descriptions.Item label="仪器名称">
                  {detailModal.detail.reservation?.instrumentName}
                </Descriptions.Item>
                <Descriptions.Item label="仪器型号">
                  {detailModal.detail.reservation?.instrumentModel}
                </Descriptions.Item>
                <Descriptions.Item label="预约时间" span={2}>
                  {formatDateTime(detailModal.detail.reservation?.startTime || new Date())} ~{' '}
                  {formatDateTime(detailModal.detail.reservation?.endTime || new Date())}
                </Descriptions.Item>
                <Descriptions.Item label="实际使用时间" span={2}>
                  {detailModal.detail.reservation?.actualStartTime
                    ? formatDateTime(detailModal.detail.reservation.actualStartTime)
                    : '未开始'}{' '}
                  ~{' '}
                  {detailModal.detail.reservation?.actualEndTime
                    ? formatDateTime(detailModal.detail.reservation.actualEndTime)
                    : '未结束'}
                </Descriptions.Item>
                <Descriptions.Item label="使用用途" span={2}>
                  {detailModal.detail.reservation?.purpose}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              size="small"
              title="费用明细"
              className="mb-4"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">实际使用时长</p>
                    <p className="text-xl font-bold">
                      {formatDuration(detailModal.detail.actualMinutes)}
                    </p>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">计费时长</p>
                    <p className="text-xl font-bold text-primary-600">
                      {formatDuration(detailModal.detail.billableMinutes)}
                    </p>
                  </div>
                </Col>
              </Row>

              <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">起步费</span>
                    <span className="font-mono">{formatMoney(detailModal.detail.baseFee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">使用费</span>
                    <span className="font-mono">{formatMoney(detailModal.detail.usageFee)}</span>
                  </div>
                  {detailModal.detail.capDiscount > 0 && (
                    <div className="flex justify-between items-center text-success">
                      <span>封顶优惠</span>
                      <span className="font-mono">-{formatMoney(detailModal.detail.capDiscount)}</span>
                    </div>
                  )}
                  <div className="h-px bg-gray-200 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">应收金额</span>
                    <span className="text-2xl font-bold text-primary-600 font-mono">
                      {formatMoney(detailModal.detail.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">计费说明：</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• 费率：{formatMoney(detailModal.detail.feeBreakdown.ratePerHour)}/小时</li>
                  <li>• 起步时长：{formatDuration(detailModal.detail.feeBreakdown.baseMinutes)}</li>
                  <li>• 封顶时长：{formatDuration(detailModal.detail.feeBreakdown.capMinutes)}</li>
                  {detailModal.detail.actualMinutes < detailModal.detail.feeBreakdown.baseMinutes && (
                    <li className="text-warning">• 实际使用不足起步时长，按起步价计费</li>
                  )}
                  {detailModal.detail.capDiscount > 0 && (
                    <li className="text-success">• 已享受封顶优惠，超出部分不计费</li>
                  )}
                </ul>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
