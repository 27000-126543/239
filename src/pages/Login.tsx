
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { login } from '../services/api';

const { Option } = Select;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useStore();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await login(values.username, values.password, values.role);
      if (res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error(res.message || '登录失败');
      }
    } catch (err) {
      message.error('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-green-950">
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <Card className="w-full max-w-md z-10 shadow-2xl border-0 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-700 to-green-600 -mx-6 -mt-6 mb-6 px-8 py-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <SafetyCertificateOutlined className="text-4xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">全国生猪产业链监测</h1>
            <p className="text-green-100 text-sm">智能分析平台</p>
          </div>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="role"
            label="用户角色"
            initialValue="national"
            rules={[{ required: true, message: '请选择用户角色' }]}
          >
            <Select prefix={<UserOutlined />}>
              <Option value="national">国家级管理员</Option>
              <Option value="provincial">省级管理员</Option>
              <Option value="municipal">市级管理员</Option>
              <Option value="enterprise">养殖场/屠宰场</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item className="mb-2">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-0 rounded-lg font-medium text-base shadow-lg shadow-green-700/30"
            >
              登录系统
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center mb-2">测试账号：</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="bg-gray-50 rounded p-2">
              <p className="font-medium">国家级管理员</p>
              <p className="text-gray-500">admin / admin123</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="font-medium">河南省畜牧局</p>
              <p className="text-gray-500">province_henan / 123456</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
