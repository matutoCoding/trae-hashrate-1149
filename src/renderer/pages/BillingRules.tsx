import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Descriptions,
  Tag,
  Space,
  Row,
  Col,
  message,
  Tooltip
} from 'antd';
import {
  SettingOutlined,
  EditOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { getAllBillingRules, updateBillingRule, calculateFee } from '../services/billingService';
import { getInstrumentModels } from '../services/scheduleService';
import { formatMoney, formatDuration } from '../utils/format';
import type { BillingRule, InstrumentModel, FeeCalculationResult } from '@shared/types';

export default function BillingRules() {
  const [rules, setRules] = useState<BillingRule[]>([]);
  const [models, setModels] = useState<InstrumentModel[]>([]);
  const [editModal, setEditModal] = useState<{ visible: boolean; rule?: BillingRule }>({ visible: false });
  const [form] = Form.useForm();
  const [demoMinutes, setDemoMinutes] = useState(120);

  useEffect(() => {
    setRules(getAllBillingRules());
    setModels(getInstrumentModels());
  }, []);

  const handleEdit = (rule: BillingRule) => {
    setEditModal({ visible: true, rule });
    form.setFieldsValue(rule);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const updated: BillingRule = {
        ...values,
        id: editModal.rule?.id || '',
        modelId: editModal.rule?.modelId || '',
        baseFee: values.baseMinutes * (values.ratePerHour / 60),
        capFee: values.capMinutes * (values.ratePerHour / 60)
      };
      updateBillingRule(updated);
      setRules(getAllBillingRules());
      setEditModal({ visible: false });
      message.success('计费规则已更新');
    });
  };

  const columns = [
    {
      title: '仪器型号',
      dataIndex: 'modelId',
      key: 'modelId',
      render: (modelId: string) => {
        const model = models.find(m => m.id === modelId);
        return model?.name || modelId;
      }
    },
    {
      title: '小时费率',
      dataIndex: 'ratePerHour',
      key: 'ratePerHour',
      render: (v: number) => <span className="font-mono font-semibold">{formatMoney(v)}</span>
    },
    {
      title: '起步时长',
      dataIndex: 'baseMinutes',
      key: 'baseMinutes',
      render: (v: number) => <Tag color="blue">{formatDuration(v)}</Tag>
    },
    {
      title: '起步价',
      dataIndex: 'baseFee',
      key: 'baseFee',
      render: (v: number) => <span className="font-mono text-blue-600">{formatMoney(v)}</span>
    },
    {
      title: '封顶时长',
      dataIndex: 'capMinutes',
      key: 'capMinutes',
      render: (v: number) => <Tag color="green">{formatDuration(v)}</Tag>
    },
    {
      title: '封顶价',
      dataIndex: 'capFee',
      key: 'capFee',
      render: (v: number) => <span className="font-mono text-green-600">{formatMoney(v)}</span>
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BillingRule) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <Card
        title={
          <Space>
            <SettingOutlined />
            计费规则说明
          </Space>
        }
        className="shadow-card border-0 rounded-xl"
      >
        <Row gutter={24}>
          <Col xs={24} md={8}>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <RocketOutlined className="text-blue-500 text-xl" />
                <h4 className="font-semibold text-blue-700">起步价保护</h4>
              </div>
              <p className="text-sm text-gray-600">
                实际使用时长不足起步时长时，按起步价计费。避免短时间使用造成的资源调度成本浪费。
              </p>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarOutlined className="text-gray-500 text-xl" />
                <h4 className="font-semibold text-gray-700">阶梯计费</h4>
              </div>
              <p className="text-sm text-gray-600">
                超出起步时长后，按实际使用分钟数计费。精确到分钟，不足1分钟按1分钟计算。
              </p>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <InfoCircleOutlined className="text-green-500 text-xl" />
                <h4 className="font-semibold text-green-700">封顶价优惠</h4>
              </div>
              <p className="text-sm text-gray-600">
                实际使用时长超过封顶时长时，按封顶价计费。鼓励长时间使用，降低大额实验成本。
              </p>
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <DollarOutlined />
            计费示例
          </Space>
        }
        className="shadow-card border-0 rounded-xl"
        extra={
          <Space>
            <span>测试使用时长：</span>
            <InputNumber
              min={1}
              max={1440}
              value={demoMinutes}
              onChange={setDemoMinutes}
              addonBefore="使用"
              addonAfter="分钟"
            />
          </Space>
        }
      >
        <Row gutter={16}>
          {rules.map(rule => {
            const model = models.find(m => m.id === rule.modelId);
            const fee = calculateFee(demoMinutes, rule);
            return (
              <Col xs={24} md={12} lg={6} key={rule.id}>
                <Card size="small" className="h-full hover:shadow-hover transition-shadow">
                  <h4 className="font-semibold mb-2">{model?.name}</h4>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="实际时长">
                      {formatDuration(fee.actualMinutes)}
                    </Descriptions.Item>
                    <Descriptions.Item label="计费时长">
                      <Tag color={fee.billableMinutes !== fee.actualMinutes ? 'warning' : 'default'}>
                        {formatDuration(fee.billableMinutes)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="起步费">
                      {formatMoney(fee.baseFee)}
                    </Descriptions.Item>
                    <Descriptions.Item label="使用费">
                      {formatMoney(fee.usageFee)}
                    </Descriptions.Item>
                    {fee.capDiscount > 0 && (
                      <Descriptions.Item label="封顶优惠">
                        <span className="text-success">-{formatMoney(fee.capDiscount)}</span>
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="应收金额">
                      <span className="text-xl font-bold text-primary-600 font-mono">
                        {formatMoney(fee.totalFee)}
                      </span>
                    </Descriptions.Item>
                  </Descriptions>
                  <div className="mt-2 text-xs text-gray-500">
                    {fee.actualMinutes < fee.baseMinutes && (
                      <Tooltip title="起步价保护">
                        <Tag color="warning">起步</Tag>
                        实际时长不足起步时长，按起步价计费
                      </Tooltip>
                    )}
                    {fee.actualMinutes > fee.capMinutes && (
                      <Tooltip title="封顶价优惠">
                        <Tag color="success">封顶</Tag>
                        已享受封顶优惠，超出部分不计费
                      </Tooltip>
                    )}
                    {fee.actualMinutes >= fee.baseMinutes && fee.actualMinutes <= fee.capMinutes && (
                      <Tooltip title="正常计费">
                        <Tag color="processing">正常</Tag>
                        按实际使用时长计费
                      </Tooltip>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <SettingOutlined />
            规则配置
          </Space>
        }
        className="shadow-card border-0 rounded-xl"
      >
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title="编辑计费规则"
        open={editModal.visible}
        onCancel={() => setEditModal({ visible: false })}
        onOk={handleSave}
        okText="保存"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="ratePerHour"
                label="小时费率（元）"
                rules={[{ required: true, message: '请输入小时费率' }]}
              >
                <InputNumber
                  min={0}
                  step={10}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入每小时费用"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="baseMinutes"
                label="起步时长（分钟）"
                rules={[{ required: true, message: '请输入起步时长' }]}
              >
                <InputNumber
                  min={1}
                  max={120}
                  style={{ width: '100%' }}
                  placeholder="起步时长"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="capMinutes"
                label="封顶时长（分钟）"
                rules={[{ required: true, message: '请输入封顶时长' }]}
              >
                <InputNumber
                  min={60}
                  max={1440}
                  style={{ width: '100%' }}
                  placeholder="封顶时长"
                />
              </Form.Item>
            </Col>
          </Row>
          <Alert
            message="系统会自动计算起步价和封顶价"
            description="起步价 = 起步时长 × 小时费率 / 60，封顶价 = 封顶时长 × 小时费率 / 60"
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  );
}
