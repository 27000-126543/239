
import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Table, Tabs, Button, Modal, Form, Input, 
  Select, Switch, Tag, message, Space, Divider, Statistic
} from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { getAllUsers } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { User } from '../types';

const { TabPane } = Tabs;
const { Option } = Select;

const SystemConfig: React.FC = () => {
  const { loading, setLoading } = useStore();
  const [users, setUsers] = useState<User[]>([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('加载用户列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setUserModalVisible(true);
  };

  const handleEditUser = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setUserModalVisible(true);
  };

  const handleDeleteUser = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该用户吗？',
      onOk: () => {
        message.success('删除成功');
        loadUsers();
      }
    });
  };

  const handleUserSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.success(editingUser ? '用户更新成功' : '用户添加成功');
      setUserModalVisible(false);
      loadUsers();
    } catch (err) {
      console.error('提交失败:', err);
    }
  };

  const roleColors: Record<string, string> = {
    national: 'purple',
    provincial: 'blue',
    municipal: 'green',
    enterprise: 'orange'
  };

  const roleLabels: Record<string, string> = {
    national: '国家级管理员',
    provincial: '省级管理员',
    municipal: '市级管理员',
    enterprise: '企业用户'
  };

  const userColumns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag color={roleColors[role]} icon={<SafetyCertificateOutlined />}>
          {roleLabels[role]}
        </Tag>
      )
    },
    {
      title: '所属地区',
      dataIndex: 'region',
      key: 'region',
      width: 150
    },
    {
      title: '联系方式',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180
    },
    {
      title: '状态',
      dataIndex: 'active',
      key: 'active',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  const [warningConfig, setWarningConfig] = useState({
    pigGrainRatioThreshold: 5.0,
    slaughterDropThreshold: 20,
    continuousDays: 5,
    enableNotification: true,
    enableEmail: true,
    enableSms: false
  });

  const [systemConfig, setSystemConfig] = useState({
    dataRetentionDays: 365,
    autoBackup: true,
    backupTime: '02:00',
    maxUploadSize: 50,
    sessionTimeout: 30
  });

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="系统用户总数"
              value={users.length}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="预警规则数"
              value={3}
              prefix={<BellOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据保留天数"
              value={systemConfig.dataRetentionDays}
              prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="系统状态"
              value="正常运行"
              prefix={<SettingOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="users">
          <TabPane 
            tab={
              <span>
                <UserOutlined />
                用户管理
              </span>
            } 
            key="users"
          >
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddUser}
              >
                添加用户
              </Button>
            </div>
            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个用户`
              }}
              scroll={{ x: 1000 }}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <BellOutlined />
                预警配置
              </span>
            } 
            key="warning"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Card title="预警阈值设置">
                  <Form layout="vertical">
                    <Form.Item label="猪粮比预警阈值">
                      <Input 
                        type="number" 
                        step="0.1"
                        value={warningConfig.pigGrainRatioThreshold}
                        onChange={(e) => setWarningConfig({
                          ...warningConfig,
                          pigGrainRatioThreshold: Number(e.target.value)
                        })}
                        addonAfter=":1"
                      />
                    </Form.Item>
                    <Form.Item label="出栏量同比骤降阈值">
                      <Input 
                        type="number" 
                        value={warningConfig.slaughterDropThreshold}
                        onChange={(e) => setWarningConfig({
                          ...warningConfig,
                          slaughterDropThreshold: Number(e.target.value)
                        })}
                        addonAfter="%"
                      />
                    </Form.Item>
                    <Form.Item label="连续触发天数">
                      <Input 
                        type="number" 
                        value={warningConfig.continuousDays}
                        onChange={(e) => setWarningConfig({
                          ...warningConfig,
                          continuousDays: Number(e.target.value)
                        })}
                        addonAfter="天"
                      />
                    </Form.Item>
                    <Button 
                      type="primary" 
                      onClick={() => message.success('预警配置已保存')}
                    >
                      保存配置
                    </Button>
                  </Form>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="通知方式设置">
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>系统通知</span>
                      <Switch 
                        checked={warningConfig.enableNotification}
                        onChange={(checked) => setWarningConfig({
                          ...warningConfig,
                          enableNotification: checked
                        })}
                      />
                    </div>
                    <Divider />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>邮件通知</span>
                      <Switch 
                        checked={warningConfig.enableEmail}
                        onChange={(checked) => setWarningConfig({
                          ...warningConfig,
                          enableEmail: checked
                        })}
                      />
                    </div>
                    <Divider />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>短信通知</span>
                      <Switch 
                        checked={warningConfig.enableSms}
                        onChange={(checked) => setWarningConfig({
                          ...warningConfig,
                          enableSms: checked
                        })}
                      />
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <SettingOutlined />
                系统配置
              </span>
            } 
            key="system"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Card title="数据管理">
                  <Form layout="vertical">
                    <Form.Item label="数据保留天数">
                      <Input 
                        type="number" 
                        value={systemConfig.dataRetentionDays}
                        onChange={(e) => setSystemConfig({
                          ...systemConfig,
                          dataRetentionDays: Number(e.target.value)
                        })}
                        addonAfter="天"
                      />
                    </Form.Item>
                    <Form.Item label="自动备份">
                      <Space>
                        <Switch 
                          checked={systemConfig.autoBackup}
                          onChange={(checked) => setSystemConfig({
                            ...systemConfig,
                            autoBackup: checked
                          })}
                        />
                        <span>每日 {systemConfig.backupTime} 自动备份</span>
                      </Space>
                    </Form.Item>
                    <Form.Item label="备份时间">
                      <Input 
                        type="time"
                        value={systemConfig.backupTime}
                        onChange={(e) => setSystemConfig({
                          ...systemConfig,
                          backupTime: e.target.value
                        })}
                      />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="上传与安全">
                  <Form layout="vertical">
                    <Form.Item label="最大上传文件大小">
                      <Input 
                        type="number" 
                        value={systemConfig.maxUploadSize}
                        onChange={(e) => setSystemConfig({
                          ...systemConfig,
                          maxUploadSize: Number(e.target.value)
                        })}
                        addonAfter="MB"
                      />
                    </Form.Item>
                    <Form.Item label="会话超时时间">
                      <Input 
                        type="number" 
                        value={systemConfig.sessionTimeout}
                        onChange={(e) => setSystemConfig({
                          ...systemConfig,
                          sessionTimeout: Number(e.target.value)
                        })}
                        addonAfter="分钟"
                      />
                    </Form.Item>
                    <Space>
                      <Button 
                        type="primary"
                        onClick={() => message.success('系统配置已保存')}
                      >
                        保存配置
                      </Button>
                      <Button 
                        onClick={() => message.info('正在清理缓存...')}
                      >
                        清理缓存
                      </Button>
                    </Space>
                  </Form>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={userModalVisible}
        onOk={handleUserSubmit}
        onCancel={() => setUserModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  <Option value="national">国家级管理员</Option>
                  <Option value="provincial">省级管理员</Option>
                  <Option value="municipal">市级管理员</Option>
                  <Option value="enterprise">企业用户</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="region"
                label="所属地区"
                rules={[{ required: true, message: '请输入所属地区' }]}
              >
                <Input placeholder="例如：河南省" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="联系方式">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="active"
            label="用户状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemConfig;
