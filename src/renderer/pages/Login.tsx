import { useState } from 'react';
import { Form, Input, Button, Select, Card, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { UserRole } from '@shared/types';
import { mockUsers } from '../services/mockData';

export default function Login() {
  const navigate = useNavigate();
  const login = useAppStore(state => state.login);
  const [loading, setLoading] = useState(false);

  const onFinish = (values: { employeeId: string; role: UserRole }) => {
    setLoading(true);
    setTimeout(() => {
      const success = login(values.employeeId, values.role);
      setLoading(false);
      if (success) {
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error('工号或角色不匹配，请重试');
      }
    }, 500);
  };

  const roleOptions = [
    { value: 'researcher', label: '科研人员' },
    { value: 'admin', label: '管理员' },
    { value: 'finance', label: '财务人员' }
  ];

  const demoAccounts = mockUsers.map(u => ({
    employeeId: u.employeeId,
    role: u.role,
    name: u.name
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-2xl mb-4 shadow-lg">
            <SafetyOutlined className="text-4xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">高校科研仪器共享平台</h1>
          <p className="text-gray-500">请选择角色并输入工号登录</p>
        </div>

        <Card className="shadow-float border-0 rounded-2xl overflow-hidden">
          <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
            <Form.Item
              name="role"
              rules={[{ required: true, message: '请选择用户角色' }]}
            >
              <Select
                placeholder="选择用户角色"
                options={roleOptions}
                className="w-full"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="employeeId"
              rules={[{ required: true, message: '请输入工号' }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="请输入工号"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-2">演示账号：</p>
            <div className="space-y-1">
              {demoAccounts.map((acc, index) => (
                <div key={index} className="text-xs text-gray-600 flex justify-between">
                  <span>{acc.name}</span>
                  <span className="font-mono text-primary-600">{acc.employeeId}</span>
                  <span className="text-gray-400">
                    {roleOptions.find(r => r.value === acc.role)?.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
