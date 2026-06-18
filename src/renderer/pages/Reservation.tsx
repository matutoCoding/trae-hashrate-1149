import { useState, useEffect } from 'react';
import {
  Form,
  Select,
  DatePicker,
  Input,
  Button,
  Card,
  Row,
  Col,
  Alert,
  Tag,
  Progress,
  Descriptions,
  Statistic,
  Space,
  Divider,
  List,
  Modal,
  message,
  Steps
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RocketOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { allocateInstrument, getAvailableInstruments } from '../services/allocationService';
import { getInstrumentModels, getReservationsByUser, updateReservationStatus, cancelReservation } from '../services/scheduleService';
import { getUserQualificationStatus, getQualificationTypeInfo } from '../services/qualificationService';
import { useAppStore } from '../store/useAppStore';
import { formatDateTime, formatDuration, formatMoney, getStatusColor, getStatusText } from '../utils/format';
import type {
  InstrumentModel,
  AllocationResult,
  Reservation,
  FeeCalculationResult
} from '@shared/types';
import { mockInstruments, mockUsers } from '../services/mockData';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Step } = Steps;

export default function Reservation() {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [form] = Form.useForm();
  const [models, setModels] = useState<InstrumentModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [allocationResult, setAllocationResult] = useState<AllocationResult | null>(null);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resultModal, setResultModal] = useState<{ visible: boolean; result?: AllocationResult }>({ visible: false });

  useEffect(() => {
    setModels(getInstrumentModels());
    if (currentUser) {
      setMyReservations(getReservationsByUser(currentUser.id));
    }
  }, [currentUser]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setAllocationResult(null);
    setCurrentStep(0);
  };

  const handlePreview = () => {
    form.validateFields().then(values => {
      if (!currentUser || !selectedModel) return;

      const [start, end] = values.timeRange;
      const startTime = start.toDate();
      const endTime = end.toDate();

      const model = models.find(m => m.id === selectedModel);
      if (!model) return;

      const qualStatus = getUserQualificationStatus(currentUser.id, model.requiredQualificationId);
      
      if (qualStatus !== 'approved') {
        let errorMsg = '';
        if (qualStatus === 'none') {
          errorMsg = '您没有该仪器的操作资质，请先在资质管理中申请';
        } else if (qualStatus === 'pending') {
          errorMsg = '您的资质申请正在审核中，请耐心等待';
        } else if (qualStatus === 'expired') {
          errorMsg = '您的资质已过期，请重新申请';
        } else if (qualStatus === 'rejected') {
          errorMsg = '您的资质申请未通过，请重新申请';
        }
        message.error(errorMsg);
        return;
      }

      const candidates = getAvailableInstruments(selectedModel, startTime, endTime, currentUser.id);
      const availableCount = candidates.filter(c => c.available).length;

      if (availableCount === 0) {
        message.warning('该时段没有可用仪器，请选择其他时间段');
        return;
      }

      setAllocationResult({
        success: true,
        candidates
      });
      setCurrentStep(1);
    });
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (!currentUser || !selectedModel) return;

      setLoading(true);
      const [start, end] = values.timeRange;
      
      setTimeout(() => {
        const result = allocateInstrument({
          modelId: selectedModel,
          startTime: start.toDate(),
          endTime: end.toDate(),
          userId: currentUser.id,
          purpose: values.purpose
        });

        setLoading(false);
        setResultModal({ visible: true, result });

        if (result.success) {
          message.success('预约成功，系统已为您自动分配仪器');
          setMyReservations(getReservationsByUser(currentUser.id));
          setCurrentStep(2);
        } else {
          message.error(result.error || '预约失败');
        }
      }, 1500);
    });
  };

  const handleCancel = (id: string) => {
    Modal.confirm({
      title: '确认取消',
      content: '确定要取消这个预约吗？',
      onOk: () => {
        if (cancelReservation(id)) {
          message.success('预约已取消');
          if (currentUser) {
            setMyReservations(getReservationsByUser(currentUser.id));
          }
        }
      }
    });
  };

  const handleStartUse = (id: string) => {
    const updated = updateReservationStatus(id, 'in-progress');
    if (updated) {
      message.success('已开始使用');
      if (currentUser) {
        setMyReservations(getReservationsByUser(currentUser.id));
      }
    }
  };

  const handleEndUse = (id: string) => {
    const updated = updateReservationStatus(id, 'completed');
    if (updated) {
      message.success('使用已结束，账单已生成');
      if (currentUser) {
        setMyReservations(getReservationsByUser(currentUser.id));
      }
      navigate('/bills');
    }
  };

  const selectedModelInfo = models.find(m => m.id === selectedModel);
  const qualStatus = selectedModel && currentUser
    ? getUserQualificationStatus(currentUser.id, selectedModelInfo?.requiredQualificationId || '')
    : 'none';
  const qualTypeInfo = selectedModelInfo
    ? getQualificationTypeInfo(selectedModelInfo.requiredQualificationId)
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <PlusOutlined />
                新建预约
              </Space>
            }
            className="shadow-card border-0 rounded-xl"
          >
            <Steps current={currentStep} className="mb-8">
              <Step title="选择仪器和时间" />
              <Step title="预览分配结果" />
              <Step title="完成预约" />
            </Steps>

            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="modelId"
                    label="仪器型号"
                    rules={[{ required: true, message: '请选择仪器型号' }]}
                  >
                    <Select
                      placeholder="请选择仪器型号"
                      onChange={handleModelChange}
                      options={models.map(m => ({
                        value: m.id,
                        label: m.name
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="资质状态">
                    {selectedModelInfo ? (
                      qualStatus === 'approved' ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          {qualTypeInfo?.name} - 已通过
                        </Tag>
                      ) : qualStatus === 'pending' ? (
                        <Tag color="warning" icon={<ClockCircleOutlined />}>
                          {qualTypeInfo?.name} - 审核中
                        </Tag>
                      ) : qualStatus === 'expired' ? (
                        <Tag color="default" icon={<InfoCircleOutlined />}>
                          {qualTypeInfo?.name} - 已过期
                        </Tag>
                      ) : qualStatus === 'rejected' ? (
                        <Tag color="error" icon={<InfoCircleOutlined />}>
                          {qualTypeInfo?.name} - 未通过
                        </Tag>
                      ) : (
                        <Tag color="error" icon={<SafetyOutlined />}>
                          {qualTypeInfo?.name} - 未申请
                        </Tag>
                      )
                    ) : (
                      <span className="text-gray-400">请先选择仪器型号</span>
                    )}
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="timeRange"
                label="使用时间"
                rules={[{ required: true, message: '请选择使用时间' }]}
              >
                <RangePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder={['开始时间', '结束时间']}
                  style={{ width: '100%' }}
                  minDate={dayjs()}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>

              <Form.Item
                name="purpose"
                label="使用用途"
                rules={[{ required: true, message: '请输入使用用途' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="请简要描述使用用途和实验内容"
                  maxLength={200}
                  showCount
                />
              </Form.Item>

              {allocationResult && allocationResult.candidates && (
                <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
                  <h4 className="font-semibold text-primary-700 mb-3">
                    <RocketOutlined className="mr-2" />
                    智能分配预览
                  </h4>
                  <List
                    size="small"
                    dataSource={allocationResult.candidates}
                    renderItem={(candidate, index) => {
                      const instrument = mockInstruments.find(i => i.id === candidate.instrument.id);
                      return (
                        <List.Item
                          className={`rounded-lg mb-2 px-3 py-2 ${
                            index === 0 && candidate.available
                              ? 'bg-primary-100 border border-primary-300'
                              : candidate.available
                              ? 'bg-white border border-gray-200'
                              : 'bg-gray-50 border border-gray-200 opacity-60'
                          }`}
                        >
                          <div className="w-full flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {index === 0 && candidate.available && (
                                <Tag color="success" icon={<CheckCircleOutlined />}>
                                  推荐
                                </Tag>
                              )}
                              <div>
                                <span className="font-medium">{candidate.instrument.name}</span>
                                <span className="text-gray-400 text-sm ml-2">
                                  {candidate.instrument.location}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="w-32">
                                <Progress
                                  percent={Math.round(candidate.loadScore * 100)}
                                  size="small"
                                  showInfo={false}
                                  strokeColor={
                                    candidate.loadScore > 0.8
                                      ? '#F53F3F'
                                      : candidate.loadScore > 0.6
                                      ? '#FF7D00'
                                      : '#00B42A'
                                  }
                                />
                              </div>
                              <span className="text-sm text-gray-500 w-20 text-right">
                                负载 {Math.round(candidate.loadScore * 100)}%
                              </span>
                              <Tag color={candidate.available ? 'success' : 'default'}>
                                {candidate.available ? '可用' : '占用'}
                              </Tag>
                            </div>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-3">
                    <InfoCircleOutlined className="mr-1" />
                    系统将根据负载均衡算法自动选择最优仪器，优先分配负载最低的设备
                  </p>
                </div>
              )}

              {allocationResult?.feeEstimate && (
                <FeePreview fee={allocationResult.feeEstimate} />
              )}

              <Form.Item className="mb-0">
                <Space>
                  {currentStep < 2 && (
                    <Button
                      type="primary"
                      size="large"
                      onClick={currentStep === 0 ? handlePreview : handleSubmit}
                      loading={loading}
                      icon={currentStep === 0 ? <InfoCircleOutlined /> : <CheckCircleOutlined />}
                    >
                      {currentStep === 0 ? '预览分配结果' : '确认预约'}
                    </Button>
                  )}
                  <Button
                    size="large"
                    onClick={() => {
                      form.resetFields();
                      setAllocationResult(null);
                      setCurrentStep(0);
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="我的预约"
            className="shadow-card border-0 rounded-xl"
          >
            {myReservations.length > 0 ? (
              <List
                dataSource={myReservations.slice(0, 10)}
                renderItem={item => {
                  const instrument = mockInstruments.find(i => i.id === item.instrumentId);
                  return (
                    <List.Item
                      className="rounded-lg mb-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      actions={
                        item.status === 'pending'
                          ? [
                              <Button type="link" danger onClick={() => handleCancel(item.id)}>
                                取消
                              </Button>
                            ]
                          : item.status === 'confirmed'
                          ? [
                              <Button type="primary" size="small" onClick={() => handleStartUse(item.id)}>
                                开始使用
                              </Button>
                            ]
                          : item.status === 'in-progress'
                          ? [
                              <Button type="primary" size="small" onClick={() => handleEndUse(item.id)}>
                                结束使用
                              </Button>
                            ]
                          : []
                      }
                    >
                      <List.Item.Meta
                        title={
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {instrument?.name}
                            </span>
                            <Tag color={getStatusColor(item.status)}>
                              {getStatusText(item.status)}
                            </Tag>
                          </div>
                        }
                        description={
                          <div className="text-sm space-y-1">
                            <div className="text-gray-600">
                              <ClockCircleOutlined className="mr-1" />
                              {formatDateTime(item.startTime)} ~ {formatDateTime(item.endTime)}
                            </div>
                            <div className="text-gray-500 truncate">{item.purpose}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            ) : (
              <div className="text-center py-12 text-gray-400">
                <ClockCircleOutlined className="text-4xl mb-2" />
                <p>暂无预约记录</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            <CheckCircleOutlined className="text-success" />
            预约成功
          </Space>
        }
        open={resultModal.visible}
        onCancel={() => setResultModal({ visible: false })}
        footer={[
          <Button key="view" onClick={() => navigate('/bills')}>
            查看账单
          </Button>,
          <Button key="ok" type="primary" onClick={() => setResultModal({ visible: false })}>
            确定
          </Button>
        ]}
        width={600}
      >
        {resultModal.result?.reservation && resultModal.result?.instrument && (
          <div className="animate-slide-up">
            <Alert
              message="系统已为您自动分配最优仪器"
              description={`根据负载均衡算法，选择了负载最低的 ${resultModal.result.instrument.name}`}
              type="success"
              showIcon
              className="mb-4"
            />
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="预约编号">
                {resultModal.result.reservation.id}
              </Descriptions.Item>
              <Descriptions.Item label="分配仪器">
                <Tag color="primary">{resultModal.result.instrument.name}</Tag>
                <span className="text-gray-500 text-sm ml-2">
                  {resultModal.result.instrument.location}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="使用时间">
                {formatDateTime(resultModal.result.reservation.startTime)} ~{' '}
                {formatDateTime(resultModal.result.reservation.endTime)}
              </Descriptions.Item>
              <Descriptions.Item label="使用用途">
                {resultModal.result.reservation.purpose}
              </Descriptions.Item>
            </Descriptions>
            {resultModal.result.feeEstimate && (
              <>
                <Divider className="my-4" />
                <FeePreview fee={resultModal.result.feeEstimate} />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function FeePreview({ fee }: { fee: FeeCalculationResult }) {
  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
      <h4 className="font-semibold text-blue-700 mb-3">
        <DollarOutlined className="mr-2" />
        费用预估
      </h4>
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="实际时长"
            value={formatDuration(fee.actualMinutes)}
            className="text-sm"
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="计费时长"
            value={formatDuration(fee.billableMinutes)}
            className="text-sm"
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="预计费用"
            value={formatMoney(fee.totalFee)}
            valueStyle={{ color: '#165DFF' }}
          />
        </Col>
      </Row>
      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <p>
          • 费率：{formatMoney(fee.ratePerHour)}/小时，
          起步{formatDuration(fee.baseMinutes)}（{formatMoney(fee.baseFee)}），
          封顶{formatDuration(fee.capMinutes)}
        </p>
        {fee.capDiscount > 0 && (
          <p className="text-success">
            • 已享受封顶优惠：减免 {formatMoney(fee.capDiscount)}
          </p>
        )}
        {fee.actualMinutes < fee.baseMinutes && (
          <p className="text-warning">
            • 实际使用不足起步时长，按起步价计费
          </p>
        )}
      </div>
    </div>
  );
}
