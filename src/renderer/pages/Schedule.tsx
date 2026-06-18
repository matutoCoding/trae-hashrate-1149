import { useState, useEffect } from 'react';
import { Row, Col, Card, List, Tag, Calendar, Button, Select, Modal, Progress, Descriptions, Space } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getInstruments, getInstrumentModels, getInstrumentSchedule, getInstrumentById, getInstrumentModelById } from '../services/scheduleService';
import { getInstrumentLoad } from '../services/allocationService';
import { getBillingRule } from '../services/billingService';
import { mockUsers } from '../services/mockData';
import { formatDateTime, formatDuration, formatMoney, getStatusColor, getStatusText } from '../utils/format';
import type { Instrument, InstrumentModel, Reservation } from '@shared/types';

export default function Schedule() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [models, setModels] = useState<InstrumentModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [schedule, setSchedule] = useState<Reservation[]>([]);
  const [detailModal, setDetailModal] = useState<{ visible: boolean; reservation?: Reservation }>({ visible: false });

  useEffect(() => {
    setInstruments(getInstruments());
    setModels(getInstrumentModels());
  }, []);

  useEffect(() => {
    if (selectedInstrument) {
      const startDate = selectedDate.startOf('week').toDate();
      const endDate = selectedDate.endOf('week').toDate();
      setSchedule(getInstrumentSchedule(selectedInstrument.id, startDate, endDate));
    }
  }, [selectedInstrument, selectedDate]);

  const filteredInstruments = selectedModel
    ? instruments.filter(i => i.modelId === selectedModel)
    : instruments;

  const getDateCellContent = (value: dayjs.Dayjs) => {
    if (!selectedInstrument) return null;
    const daySchedule = schedule.filter(r => {
      const rDate = dayjs(r.startTime).format('YYYY-MM-DD');
      return rDate === value.format('YYYY-MM-DD');
    });

    return (
      <div className="min-h-16 py-1">
        {daySchedule.slice(0, 3).map(r => (
          <div
            key={r.id}
            className={`text-xs px-1 py-0.5 mb-1 rounded truncate cursor-pointer hover:opacity-80 ${
              r.status === 'cancelled' ? 'bg-gray-200 text-gray-500 line-through' : 'bg-primary-100 text-primary-700'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setDetailModal({ visible: true, reservation: r });
            }}
          >
            {dayjs(r.startTime).format('HH:mm')} - {mockUsers.find(u => u.id === r.userId)?.name}
          </div>
        ))}
        {daySchedule.length > 3 && (
          <div className="text-xs text-gray-400 text-center">+{daySchedule.length - 3} 更多</div>
        )}
      </div>
    );
  };

  const load = selectedInstrument ? getInstrumentLoad(selectedInstrument.id, 7) : null;
  const model = selectedInstrument ? getInstrumentModelById(selectedInstrument.modelId) : null;
  const billingRule = selectedInstrument ? getBillingRule(selectedInstrument.modelId) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-card border-0 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Select
              placeholder="选择仪器型号"
              allowClear
              style={{ width: 220 }}
              value={selectedModel || undefined}
              onChange={setSelectedModel}
              options={models.map(m => ({ value: m.id, label: m.name }))}
            />
            <span className="text-gray-500">
              共 {filteredInstruments.length} 台仪器
            </span>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card title="仪器列表" className="h-full" size="small">
              <List
                dataSource={filteredInstruments}
                renderItem={item => {
                  const itemLoad = getInstrumentLoad(item.id, 7);
                  return (
                    <List.Item
                      className={`cursor-pointer rounded-lg mb-2 px-3 py-3 transition-all ${
                        selectedInstrument?.id === item.id
                          ? 'bg-primary-50 border border-primary-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      onClick={() => setSelectedInstrument(item)}
                    >
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800">{item.name}</h4>
                            <p className="text-xs text-gray-500">
                              <EnvironmentOutlined className="mr-1" />
                              {item.location}
                            </p>
                          </div>
                          <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            percent={itemLoad.loadPercentage}
                            size="small"
                            showInfo={false}
                            strokeColor={
                              itemLoad.loadPercentage > 80
                                ? '#F53F3F'
                                : itemLoad.loadPercentage > 60
                                ? '#FF7D00'
                                : '#00B42A'
                            }
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {itemLoad.loadPercentage}%
                          </span>
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            {selectedInstrument ? (
              <div className="space-y-4">
                <Card size="small" className="shadow-card border-0 rounded-xl">
                  <Descriptions column={3} size="small">
                    <Descriptions.Item label="仪器名称">{selectedInstrument.name}</Descriptions.Item>
                    <Descriptions.Item label="仪器型号">{model?.name}</Descriptions.Item>
                    <Descriptions.Item label="设备编号">{selectedInstrument.serialNumber}</Descriptions.Item>
                    <Descriptions.Item label="放置位置">{selectedInstrument.location}</Descriptions.Item>
                    <Descriptions.Item label="运行状态">
                      <Tag color={getStatusColor(selectedInstrument.status)}>
                        {getStatusText(selectedInstrument.status)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="日设计时长">{selectedInstrument.designDailyHours}小时</Descriptions.Item>
                    <Descriptions.Item label="7日负载">
                      <Progress
                        percent={load?.loadPercentage || 0}
                        size="small"
                        format={percent => `${percent}%`}
                        strokeColor={
                          (load?.loadPercentage || 0) > 80
                            ? '#F53F3F'
                            : (load?.loadPercentage || 0) > 60
                            ? '#FF7D00'
                            : '#00B42A'
                        }
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="收费标准">
                      {billingRule && (
                        <span>
                          {formatMoney(billingRule.ratePerHour)}/小时
                          <Tag className="ml-2" color="blue">起步{formatDuration(billingRule.baseMinutes)}</Tag>
                          <Tag className="ml-1" color="green">封顶{formatDuration(billingRule.capMinutes)}</Tag>
                        </span>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card
                  title={
                    <Space>
                      <CalendarOutlined />
                      排期日历
                    </Space>
                  }
                  className="shadow-card border-0 rounded-xl"
                >
                  <Calendar
                    value={selectedDate}
                    onChange={setSelectedDate}
                    cellRender={getDateCellContent}
                  />
                </Card>

                <Card
                  title={
                    <Space>
                      <ClockCircleOutlined />
                      本周排期详情
                    </Space>
                  }
                  className="shadow-card border-0 rounded-xl"
                >
                  {schedule.length > 0 ? (
                    <List
                      dataSource={schedule}
                      renderItem={item => (
                        <List.Item
                          className="cursor-pointer hover:bg-gray-50 rounded-lg px-3 -mx-3"
                          onClick={() => setDetailModal({ visible: true, reservation: item })}
                        >
                          <List.Item.Meta
                            title={
                              <div className="flex justify-between items-center">
                                <span className="font-medium">
                                  {mockUsers.find(u => u.id === item.userId)?.name}
                                </span>
                                <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                              </div>
                            }
                            description={
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">
                                  {formatDateTime(item.startTime)} ~ {formatDateTime(item.endTime)}
                                </span>
                                <span className="text-primary-600">
                                  {item.purpose}
                                </span>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <InfoCircleOutlined className="text-4xl mb-2" />
                      <p>本周暂无预约</p>
                    </div>
                  )}
                </Card>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <CalendarOutlined className="text-6xl mb-4 opacity-30" />
                  <p>请从左侧选择一台仪器查看排期</p>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      <Modal
        title="预约详情"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false })}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ visible: false })}>
            关闭
          </Button>
        ]}
      >
        {detailModal.reservation && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="预约编号">{detailModal.reservation.id}</Descriptions.Item>
            <Descriptions.Item label="预约人">
              {mockUsers.find(u => u.id === detailModal.reservation!.userId)?.name}
            </Descriptions.Item>
            <Descriptions.Item label="仪器">
              {getInstrumentById(detailModal.reservation.instrumentId)?.name}
            </Descriptions.Item>
            <Descriptions.Item label="预约时间">
              {formatDateTime(detailModal.reservation.startTime)} ~ {formatDateTime(detailModal.reservation.endTime)}
            </Descriptions.Item>
            {detailModal.reservation.actualStartTime && (
              <Descriptions.Item label="实际使用时间">
                {formatDateTime(detailModal.reservation.actualStartTime)} ~ 
                {detailModal.reservation.actualEndTime && formatDateTime(detailModal.reservation.actualEndTime)}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="使用用途">{detailModal.reservation.purpose}</Descriptions.Item>
            <Descriptions.Item label="预约状态">
              <Tag color={getStatusColor(detailModal.reservation.status)}>
                {getStatusText(detailModal.reservation.status)}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
