import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Progress, Button, List } from 'antd';
import {
  DashboardOutlined,
  ToolOutlined,
  CalendarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Column } from '@ant-design/charts';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { getDashboardStats, getReservationsByUser } from '../services/scheduleService';
import { getAllInstrumentLoads } from '../services/allocationService';
import { getBillsSummary } from '../services/billService';
import { useAppStore } from '../store/useAppStore';
import { formatDateTime, formatMoney, getStatusColor, getStatusText } from '../utils/format';
import type { DashboardStats, InstrumentLoad, Reservation } from '@shared/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [instrumentLoads, setInstrumentLoads] = useState<InstrumentLoad[]>([]);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [billsSummary, setBillsSummary] = useState<any>(null);

  useEffect(() => {
    setStats(getDashboardStats());
    setInstrumentLoads(getAllInstrumentLoads(7));
    if (currentUser) {
      setRecentReservations(getReservationsByUser(currentUser.id).slice(0, 5));
      setBillsSummary(getBillsSummary(currentUser.id));
    }
  }, [currentUser]);

  const chartData = instrumentLoads.map(load => ({
    name: load.instrumentName,
    使用率: load.loadPercentage
  }));

  const chartConfig = {
    data: chartData,
    xField: 'name',
    yField: '使用率',
    color: '#165DFF',
    columnStyle: {
      radius: [4, 4, 0, 0]
    },
    yAxis: {
      max: 100,
      label: {
        formatter: (v: string) => `${v}%`
      }
    },
    height: 300
  };

  const reservationColumns = [
    {
      title: '仪器',
      dataIndex: 'instrumentId',
      key: 'instrumentId'
    },
    {
      title: '时间',
      key: 'time',
      render: (_: any, record: Reservation) => (
        <div className="text-sm">
          <div>{formatDateTime(record.startTime)}</div>
          <div className="text-gray-400">至 {formatDateTime(record.endTime)}</div>
        </div>
      )
    },
    {
      title: '用途',
      dataIndex: 'purpose',
      key: 'purpose',
      ellipsis: true
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: Reservation) => (
        <Tag color={getStatusColor(record.status)}>{getStatusText(record.status)}</Tag>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="仪器总数"
            value={stats?.totalInstruments || 0}
            icon={<ToolOutlined />}
            color="#165DFF"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="可用仪器"
            value={stats?.availableInstruments || 0}
            icon={<DashboardOutlined />}
            color="#00B42A"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="今日预约"
            value={stats?.todayReservations || 0}
            icon={<CalendarOutlined />}
            color="#FF7D00"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="本月营收"
            value={formatMoney(stats?.monthRevenue || 0)}
            icon={<DollarOutlined />}
            color="#722ED1"
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card
            title="仪器负载均衡情况（近7日）"
            extra={
              <Button type="link" onClick={() => navigate('/schedule')}>
                查看排期 <ArrowRightOutlined />
              </Button>
            }
            className="shadow-card border-0 rounded-xl"
          >
            <Column {...chartConfig} />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="仪器负载详情"
            className="shadow-card border-0 rounded-xl"
          >
            <List
              dataSource={instrumentLoads.slice(0, 6)}
              renderItem={item => (
                <List.Item className="px-0">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{item.instrumentName}</span>
                      <span className="text-sm text-gray-500">
                        {item.usedHours}/{item.totalHours}小时
                      </span>
                    </div>
                    <Progress
                      percent={item.loadPercentage}
                      showInfo={false}
                      strokeColor={
                        item.loadPercentage > 80
                          ? '#F53F3F'
                          : item.loadPercentage > 60
                          ? '#FF7D00'
                          : '#00B42A'
                      }
                      size="small"
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card
            title="我的预约"
            extra={
              <Button type="link" onClick={() => navigate('/reservation')}>
                新建预约 <ArrowRightOutlined />
              </Button>
            }
            className="shadow-card border-0 rounded-xl"
          >
            <Table
              columns={reservationColumns}
              dataSource={recentReservations}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="费用概览"
            extra={
              <Button type="link" onClick={() => navigate('/bills')}>
                查看账单 <ArrowRightOutlined />
              </Button>
            }
            className="shadow-card border-0 rounded-xl"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">账单总数</p>
                  <p className="text-2xl font-bold text-gray-800">{billsSummary?.totalCount || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                  <FileTextOutlined className="text-xl text-primary-500" />
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-success/10 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">已支付</p>
                  <p className="text-2xl font-bold text-success">{formatMoney(billsSummary?.paidAmount || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircleOutlined className="text-xl text-success" />
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-warning/10 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">待支付</p>
                  <p className="text-2xl font-bold text-warning">{formatMoney(billsSummary?.pendingAmount || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <ClockCircleOutlined className="text-xl text-warning" />
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
