import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  Descriptions,
  Row,
  Col,
  Statistic,
  message,
  Upload
} from 'antd';
import {
  SafetyCertificateOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UploadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getQualificationsByUser,
  getPendingQualifications,
  applyQualification,
  reviewQualification,
  qualificationTypes,
  getUserQualificationStatus
} from '../services/qualificationService';
import { useAppStore } from '../store/useAppStore';
import { formatDate, getStatusColor, getStatusText } from '../utils/format';
import type { Qualification, QualificationStatus } from '@shared/types';
import { mockUsers } from '../services/mockData';

const { RangePicker } = DatePicker;

export default function Qualifications() {
  const { currentUser } = useAppStore();
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [pendingList, setPendingList] = useState<Qualification[]>([]);
  const [applyModal, setApplyModal] = useState(false);
  const [detailModal, setDetailModal] = useState<{ visible: boolean; qualification?: Qualification }>({ visible: false });
  const [form] = Form.useForm();

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = () => {
    if (currentUser) {
      if (isAdmin) {
        setPendingList(getPendingQualifications());
      }
      setQualifications(getQualificationsByUser(currentUser.id));
    }
  };

  const handleApply = () => {
    form.validateFields().then(values => {
      const [issueDate, expiryDate] = values.validPeriod;
      const newQual = applyQualification({
        userId: currentUser!.id,
        type: values.type,
        typeName: qualificationTypes.find(t => t.type === values.type)?.name || '',
        certificateNumber: values.certificateNumber,
        issueDate: issueDate.toDate(),
        expiryDate: expiryDate.toDate()
      });
      message.success('资质申请已提交，等待审核');
      setApplyModal(false);
      form.resetFields();
      loadData();
    });
  };

  const handleReview = (id: string, status: Exclude<QualificationStatus, 'pending'>) => {
    Modal.confirm({
      title: status === 'approved' ? '通过审核' : '拒绝申请',
      content: status === 'approved' ? '确认通过该资质申请吗？' : '确认拒绝该资质申请吗？',
      onOk: () => {
        const updated = reviewQualification(id, status);
        if (updated) {
          message.success(status === 'approved' ? '已通过' : '已拒绝');
          loadData();
        }
      }
    });
  };

  const columns = [
    {
      title: '资质类型',
      dataIndex: 'typeName',
      key: 'typeName',
      render: (v: string, record: Qualification) => (
        <div>
          <p className="font-medium">{v}</p>
          <p className="text-xs text-gray-400">{record.certificateNumber}</p>
        </div>
      )
    },
    {
      title: '证书编号',
      dataIndex: 'certificateNumber',
      key: 'certificateNumber',
      render: (v: string) => <span className="font-mono">{v}</span>
    },
    {
      title: '发证日期',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (v: Date) => formatDate(v)
    },
    {
      title: '有效期至',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (v: Date) => {
        const isExpiring = dayjs(v).diff(dayjs(), 'month') <= 1;
        return (
          <span className={isExpiring ? 'text-danger' : ''}>
            {formatDate(v)}
            {isExpiring && <Tag color="warning" className="ml-1">即将到期</Tag>}
          </span>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: QualificationStatus) => (
        <Tag color={getStatusColor(v)}>{getStatusText(v)}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Qualification) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setDetailModal({ visible: true, qualification: record })}
        >
          详情
        </Button>
      )
    }
  ];

  const pendingColumns = [
    {
      title: '申请人',
      dataIndex: 'userId',
      key: 'userId',
      render: (v: string) => mockUsers.find(u => u.id === v)?.name || v
    },
    ...columns.slice(0, -1),
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Qualification) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleReview(record.id, 'approved')}
          >
            通过
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleReview(record.id, 'rejected')}
          >
            拒绝
          </Button>
        </Space>
      )
    }
  ];

  const statusStats = qualificationTypes.map(type => {
    const status = currentUser ? getUserQualificationStatus(currentUser.id, type.type) : 'none';
    return { type, status };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-card border-0 rounded-xl">
        <h3 className="font-semibold mb-4">
          <SafetyCertificateOutlined className="mr-2" />
          资质状态概览
        </h3>
        <Row gutter={[16, 16]}>
          {statusStats.map(({ type, status }) => (
            <Col xs={24} sm={12} lg={8} key={type.type}>
              <div
                className={`p-4 rounded-xl border-2 transition-all ${
                  status === 'approved'
                    ? 'border-green-200 bg-green-50'
                    : status === 'pending'
                    ? 'border-yellow-200 bg-yellow-50'
                    : status === 'expired'
                    ? 'border-gray-200 bg-gray-50'
                    : status === 'rejected'
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{type.name}</h4>
                  {status === 'approved' && <CheckCircleOutlined className="text-success text-xl" />}
                  {status === 'pending' && <ClockCircleOutlined className="text-warning text-xl" />}
                  {status === 'none' && <CloseCircleOutlined className="text-gray-300 text-xl" />}
                  {status === 'expired' && <CloseCircleOutlined className="text-gray-400 text-xl" />}
                  {status === 'rejected' && <CloseCircleOutlined className="text-danger text-xl" />}
                </div>
                <p className="text-sm text-gray-500">{type.description}</p>
                <Tag
                  className="mt-2"
                  color={
                    status === 'approved'
                      ? 'success'
                      : status === 'pending'
                      ? 'warning'
                      : status === 'none'
                      ? 'default'
                      : status === 'expired'
                      ? 'default'
                      : 'error'
                  }
                >
                  {status === 'approved' && '已通过'}
                  {status === 'pending' && '审核中'}
                  {status === 'none' && '未申请'}
                  {status === 'expired' && '已过期'}
                  {status === 'rejected' && '未通过'}
                </Tag>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {isAdmin && pendingList.length > 0 && (
        <Card
          title={
            <Space>
              <ClockCircleOutlined className="text-warning" />
              待审核资质（{pendingList.length}）
            </Space>
          }
          className="shadow-card border-0 rounded-xl"
        >
          <Table
            columns={pendingColumns}
            dataSource={pendingList}
            rowKey="id"
            pagination={false}
          />
        </Card>
      )}

      <Card
        title={
          <Space>
            <SafetyCertificateOutlined />
            我的资质
          </Space>
        }
        className="shadow-card border-0 rounded-xl"
        extra={
          !isAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setApplyModal(true)}
            >
              申请资质
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={qualifications}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title="申请操作资质"
        open={applyModal}
        onCancel={() => setApplyModal(false)}
        onOk={handleApply}
        okText="提交申请"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="type"
            label="资质类型"
            rules={[{ required: true, message: '请选择资质类型' }]}
          >
            <Select
              placeholder="请选择要申请的资质类型"
              options={qualificationTypes.map(t => ({
                value: t.type,
                label: `${t.name} - ${t.description}`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="certificateNumber"
            label="证书编号"
            rules={[{ required: true, message: '请输入证书编号' }]}
          >
            <Input placeholder="请输入证书编号" />
          </Form.Item>

          <Form.Item
            name="validPeriod"
            label="有效期"
            rules={[{ required: true, message: '请选择有效期' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['发证日期', '到期日期']}
              disabledDate={(current) => current && current > dayjs().add(10, 'year').toDate()}
            />
          </Form.Item>

          <Form.Item label="证书上传">
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.jpg,.png"
            >
              <Button icon={<UploadOutlined />}>上传证书扫描件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="资质详情"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false })}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ visible: false })}>
            关闭
          </Button>
        ]}
      >
        {detailModal.qualification && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="资质类型">
              {detailModal.qualification.typeName}
            </Descriptions.Item>
            <Descriptions.Item label="证书编号">
              <span className="font-mono">{detailModal.qualification.certificateNumber}</span>
            </Descriptions.Item>
            <Descriptions.Item label="持有人">
              {mockUsers.find(u => u.id === detailModal.qualification!.userId)?.name}
            </Descriptions.Item>
            <Descriptions.Item label="发证日期">
              {formatDate(detailModal.qualification.issueDate)}
            </Descriptions.Item>
            <Descriptions.Item label="有效期至">
              {formatDate(detailModal.qualification.expiryDate)}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(detailModal.qualification.status)}>
                {getStatusText(detailModal.qualification.status)}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
