
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  DatabaseOutlined,
  WarningOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { useStore } from '../store/useStore';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, warnings } = useStore();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!user && storedUser) {
      useStore.getState().setUser(JSON.parse(storedUser));
    }
  }, [user]);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '核心监测看板',
    },
    {
      key: 'data',
      icon: <DatabaseOutlined />,
      label: '产业链数据中心',
      children: [
        { key: '/data/farms', label: '养殖场数据' },
        { key: '/data/slaughterhouses', label: '屠宰场数据' },
        { key: '/data/markets', label: '批发市场数据' },
        { key: '/data/upload', label: '数据上传' },
      ]
    },
    {
      key: '/warning',
      icon: <Badge count={warnings.filter(w => w.status === 'pending' || w.status === 'confirmed').length} size="small">
        <WarningOutlined />
      </Badge>,
      label: '智能预警中心',
    },
    {
      key: '/approval',
      icon: <FileSearchOutlined />,
      label: '审批流程中心',
    },
    {
      key: '/forecast',
      icon: <BarChartOutlined />,
      label: '预测分析中心',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '报告自动生成',
    },
    {
      key: 'system',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
        { key: '/system/users', label: '用户管理' },
        { key: '/system/config', label: '基础配置' },
      ]
    },
  ];

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      national: '国家级管理员',
      provincial: '省级管理员',
      municipal: '市级管理员',
      enterprise: '企业用户'
    };
    return roleMap[role] || role;
  };

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="bg-gradient-to-b from-green-900 to-green-950 border-r-0"
        width={240}
      >
        <div className="h-16 flex items-center justify-center border-b border-green-800/50">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">猪</span>
              </div>
              <span className="text-white font-semibold text-base">生猪监测平台</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">猪</span>
            </div>
          )}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="bg-transparent border-r-0 text-green-100 mt-2"
          style={{ color: '#d1fae5' }}
        />
      </Sider>
      
      <Layout>
        <Header className="bg-white border-b border-gray-100 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="hover:bg-gray-100"
            />
            <div>
              <h2 className="text-lg font-semibold text-gray-800 m-0">
                {menuItems.flatMap(m => m.children || [m]).find(m => m.key === location.pathname)?.label || '系统'}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge count={warnings.filter(w => w.status === 'pending').length} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined className="text-lg" />}
                onClick={() => navigate('/warning')}
              />
            </Badge>
            
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
                <Avatar 
                  size="small" 
                  className="bg-gradient-to-r from-green-600 to-green-700"
                  icon={<UserOutlined />}
                />
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-gray-800 m-0">{user?.name || '用户'}</p>
                  <p className="text-xs text-gray-500 m-0">{getRoleText(user?.role || '')}</p>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="bg-gray-50 p-6 overflow-auto">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
