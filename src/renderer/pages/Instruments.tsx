import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Descriptions,
  Row,
  Col,
  Statistic,
  message,
  Progress
} from 'antd';
import {
  ToolOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import {
  getInstruments,
  getInstrumentModels,
  createInstrument,
  updateInstrument,
  getInstrumentById
} from '../services/scheduleService';
import { getInstrumentLoad, getAllInstrumentLoads } from '../services/allocationService';
import { formatMoney, formatDuration, getStatusColor, getStatusText } from '../utils/format';
import { getBillingRule } from '../services/billingService';
import type { Instrument, InstrumentModel, InstrumentStatus } from '@shared/types';

const statusOptions: { value: InstrumentStatus; label: string }[] = [
  { value: 'available', label: '可用' },
  { value: 'in-use', label: '使用中' },
  { value: 'maintenance', label: '维护中' },
  { value: 'offline', label: '离线' }
];

export default function Instruments() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [models, setModels] = useState<InstrumentModel[]>([]);
  const [loads, setLoads] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [editModal, setEditModal] = useState<{ visible: boolean; instrument?: Instrument }>({ visible: false });
  const [detailModal, setDetailModal] = useState<{ visible: boolean; instrument?: Instrument }>({ visible: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setInstruments(getInstruments());
    setModels(getInstrumentModels());
    setLoads(getAllInstrumentLoads(7));
  };

  const handleAdd = () => {
    setEditModal({ visible: true });
    form.resetFields();
  };

  const handleEdit = (instrument: Instrument) => {
    setEditModal({ visible: true, instrument });
    form.setFieldsValue(instrument);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      if (editModal.instrument) {
        const updated = updateInstrument({
          ...editModal.instrument,
          ...values
        });
        if (updated) {
          message.success('仪器信息已更新');
        }
      } else {
        createInstrument({
          ...values,
          status: 'available'
        });
        message.success('仪器已添加');
      }
      setEditModal({ visible: false });
      loadData();
    });
  };

  const handleViewDetail = (instrument: Instrument) => {
    setDetailModal({ visible: true, instrument });
  };

  const columns = [
    {
      title: '仪器名称',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, record: Instrument) => (
        <div>
          <p className="font-medium">{v}</p>
          <p className="text-xs text-gray-400 font-mono">{record.serialNumber}</p>
        </div>
      )
    },
    {
      title: '仪器型号',
      dataIndex: 'modelId',
      key: 'modelId',
      render: (v: string) => models.find(m => m.id === v)?.name || v
    },
    {
      title: '放置位置',
      dataIndex: 'location',
      key: 'location',
      render: (v: string) => (
        <span>
          <EnvironmentOutlined className="mr-1 text-gray-400" />
          {v}
        </span>
      )
    },
    {
      title: '运行状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: InstrumentStatus) => (
        <Tag color={getStatusColor(v)}>{getStatusText(v)}</Tag>
      )
    },
    {
      title: '7日负载',
      key: 'load',
      render: (_: any, record: Instrument) => {
        const load = loads.find(l => l.instrumentId === record.id);
        return load ? (
          <div className="w-32">
            <Progress
              percent={load.loadPercentage}
              size="small"
              format={(percent) => `${percent}%`}
              strokeColor={
                load.loadPercentage > 80
                  ? '#F53F3F'
                  : load.loadPercentage > 60
                  ? '#FF7D00'
                  : '#00B42A'
              }
            />
          </div>
        ) : '-';
      }
    },
    {
      title: '日设计时长',
      dataIndex: 'designDailyHours',
      key: 'designDailyHours',
      render: (v: number) => `${v}小时`
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_: any, record: Instrument) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Space>
      )
    }
  ];

  const stats = {
    total: instruments.length,
    available: instruments.filter(i => i.status === 'available').length,
    inUse: instruments.filter(i => i.status === 'in-use').length,
    maintenance: instruments.filter(i => i.status === 'maintenance').length,
    avgLoad: loads.length > 0
      ? (loads.reduce((sum, l) => sum + l.loadPercentage, 0) / loads.length).toFixed(1)
      : '0'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="shadow-card border-0 rounded-xl">
            <Statistic
              title="仪器总数"
              value={stats.total}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#165DFF' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-card border-0 rounded-xl">
            <Statistic
              title="可用仪器"
              value={stats.available}
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#00B42A' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-card border-0 rounded-xl">
            <Statistic
              title="平均负载"
              value={stats.avgLoad}
              suffix="%"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#FF7D00' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ToolOutlined />
            仪器管理
          </Space>
        }
        className="shadow-card border-0 rounded-xl"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加仪器
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={instruments}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title={editModal.instrument ? '编辑仪器' : '添加仪器'}
        open={editModal.visible}
        onCancel={() => setEditModal({ visible: false })}
        onOk={handleSave}
        okText="保存"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="仪器名称"
                rules={[{ required: true, message: '请输入仪器名称' }]}
              >
                <Input placeholder="如：TEM-04" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="modelId"
                label="仪器型号"
                rules={[{ required: true, message: '请选择仪器型号' }]}
              >
                <Select
                  placeholder="请选择仪器型号"
                  options={models.map(m => ({
                    value: m.id,
                    label: m.name
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="serialNumber"
                label="设备编号"
                rules={[{ required: true, message: '请输入设备编号' }]}
              >
                <Input placeholder="如：SN2024001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label="放置位置"
                rules={[{ required: true, message: '请输入放置位置' }]}
              >
                <Input placeholder="如：A座101室" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="designDailyHours"
                label="日设计使用时长（小时）"
                rules={[{ required: true, message: '请输入日设计使用时长' }]}
              >
                <InputNumber
                  min={1}
                  max={24}
                  style={{ width: '100%' }}
                  placeholder="8"
                />
              </Form.Item>
            </Col>
            {editModal.instrument && (
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="运行状态"
                  rules={[{ required: true, message: '请选择运行状态' }]}
                >
                  <Select
                    placeholder="请选择运行状态"
                    options={statusOptions}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>

      <Modal
        title="仪器详情"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false })}
        width={700}
        footer={[
          detailModal.instrument && (
            <Button
              key="edit"
              type="primary"
              onClick={() => {
                handleEdit(detailModal.instrument!);
                setDetailModal({ visible: false });
              }}
            >
              编辑
            </Button>
          ),
          <Button key="close" onClick={() => setDetailModal({ visible: false })}>
            关闭
          </Button>
        ]}
      >
        {detailModal.instrument && (
          <div className="animate-fade-in">
            <Descriptions column={2} bordered className="mb-4">
              <Descriptions.Item label="仪器名称">
                {detailModal.instrument.name}
              </Descriptions.Item>
              <Descriptions.Item label="设备编号">
                <span className="font-mono">{detailModal.instrument.serialNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="仪器型号">
                {models.find(m => m.id === detailModal.instrument!.modelId)?.name}
              </Descriptions.Item>
              <Descriptions.Item label="放置位置">
                <EnvironmentOutlined className="mr-1" />
                {detailModal.instrument.location}
              </Descriptions.Item>
              <Descriptions.Item label="运行状态">
                <Tag color={getStatusColor(detailModal.instrument.status)}>
                  {getStatusText(detailModal.instrument.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="日设计时长">
                {detailModal.instrument.designDailyHours}小时
              </Descriptions.Item>
            </Descriptions>

            {(() => {
              const model = models.find(m => m.id === detailModal.instrument!.modelId);
              const rule = getBillingRule(detailModal.instrument.modelId);
              const load = loads.find(l => l.instrumentId === detailModal.instrument!.id);
              return (
                <>
                  <Card size="small" title="计费规则" className="mb-4">
                    {rule && (
                      <Row gutter={16}>
                        <Col span={8}>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">小时费率</p>
                            <p className="text-xl font-bold text-primary-600 font-mono">
                              {formatMoney(rule.ratePerHour)}
                            </p>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">起步时长</p>
                            <p className="text-xl font-bold text-blue-600">
                              {formatDuration(rule.baseMinutes)}
                            </p>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">封顶时长</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatDuration(rule.capMinutes)}
                            </p>
                          </div>
                        </Col>
                      </Row>
                    )}
                  </Card>

                  <Card size="small" title="负载情况（近7日）">
                    {load && (
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-600">负载率</span>
                          <span
                            className={`text-2xl font-bold ${
                              load.loadPercentage > 80
                                ? 'text-red-500'
                                : load.loadPercentage > 60
                                ? 'text-orange-500'
                                : 'text-green-500'
                            }`}
                          >
                            {load.loadPercentage}%
                          </span>
                        </div>
                        <Progress
                          percent={load.loadPercentage}
                          strokeColor={
                            load.loadPercentage > 80
                              ? '#F53F3F'
                              : load.loadPercentage > 60
                              ? '#FF7D00'
                              : '#00B42A'
                          }
                          size="large"
                        />
                        <div className="flex justify-between mt-4 text-sm text-gray-500">
                          <span>已使用 {load.usedHours} 小时</span>
                          <span>设计时长 {load.totalHours} 小时</span>
                          <span>预约次数 {load.reservationCount} 次</span>
                        </div>
                      </div>
                    )}
                  </Card>

                  {model && (
                    <Card size="small" title="型号说明" className="mt-4">
                      <p className="text-gray-600">{model.description}</p>
                    </Card>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
