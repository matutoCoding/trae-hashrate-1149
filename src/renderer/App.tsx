import { Outlet } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import './styles/index.css';

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#165DFF',
          borderRadius: 8,
          fontFamily: '"Source Han Sans CN", "Noto Sans SC", system-ui, sans-serif'
        }
      }}
    >
      <AntApp>
        <Layout>
          <Outlet />
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}
