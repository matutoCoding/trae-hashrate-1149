import { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  PlusCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getRoleText } from '../utils/format';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, sidebarCollapsed, toggleSidebar, logout } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      onClick: () => navigate('/dashboard')
    },
    {
      key: '/schedule',
      icon: <CalendarOutlined />,
      label: '仪器排期',
      onClick: () => navigate('/schedule')
    },
    {
      key: '/reservation',
      icon: <PlusCircleOutlined />,
      label: '预约申请',
      onClick: () => navigate('/reservation')
    },
    {
      key: '/bills',
      icon: <FileTextOutlined />,
      label: '账单管理',
      onClick: () => navigate('/bills')
    },
    {
      key: '/qualifications',
      icon: <SafetyCertificateOutlined />,
      label: '资质管理',
      onClick: () => navigate('/qualifications')
    },
    ...(currentUser?.role === 'admin'
      ? [
          {
            key: '/billing-rules',
            icon: <DollarOutlined />,
            label: '计费规则',
            onClick: () => navigate('/billing-rules')
          },
          {
            key: '/instruments',
            icon: <SettingOutlined />,
            label: '仪器管理',
            onClick: () => navigate('/instruments')
          }
        ]
      : [])
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <div className="flex flex-col">
          <span className="font-medium">{currentUser?.name}</span>
          <span className="text-xs text-gray-500">{currentUser?.employeeId}</span>
        </div>
      ),
      disabled: true
    },
    { type: 'divider' },
    {
      key: '2',
      icon: <UserOutlined />,
      label: getRoleText(currentUser?.role || ''),
      disabled: true
    },
    {
      key: '3',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      }
    }
  ];

  return (
    <AntLayout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-white border-r border-gray-200"
        width={240}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1
            className={`font-bold text-primary-600 transition-all ${
              collapsed ? 'text-lg' : 'text-xl'
            }`}
          >
            {collapsed ? '科研' : '科研仪器共享'}
          </h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-r-0 mt-2"
        />
      </Sider>
      <AntLayout>
        <Header className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="!text-lg"
            />
            <h2 className="text-lg font-semibold text-gray-800">
              {menuItems.find(m => m?.key === location.pathname)?.label as string}
            </h2>
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
              <Avatar size={36} icon={<UserOutlined />} className="bg-primary-500" />
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">{currentUser?.name}</span>
                  <span className="text-xs text-gray-500">{currentUser?.department}</span>
                </div>
              )}
            </div>
          </Dropdown>
        </Header>
        <Content className="p-6 bg-gray-50">{children}</Content>
      </AntLayout>
    </AntLayout>
  );
}
