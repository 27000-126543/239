
import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, message, Timeline, Space, Badge } from 'antd';
import { 
  WarningOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { getWarnings, approveWarningStep } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { Warning } from '../types';

const WarningCenter: React.FC = () => {
  const { warnings, setWarnings, user } = useStore();
  const [loading, setLoading] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadWarnings();
  }, []);

  const loadWarnings = async () => {
    setLoading(true);
    try {
      const res = await getWarnings();
      if (res.success && res.data) {
        setWarnings(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const getWarningTypeText = (type: string) => {
    const map: Record<string, string> = {
      'grain_ratio': '猪粮比过低',
      'slaughter_drop': '出栏量骤降'
    };
    return map[type] || type;
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      'pending': '待确认',
      'confirmed': '已确认',
      'reviewed': '已复核',
      'approved': '已批准',
      'resolved': '已处理'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'pending': 'warning',
      'confirmed': 'processing',
      'reviewed': 'processing',
      'approved': 'success',
      'resolved': 'default'
    };
    return map[status] || 'default';
  };

  const getRoleText = (role: string) => {
    const map: Record<string, string> = {
      'enterprise': '养殖场负责人',
      'provincial': '省级畜牧局',
      'national': '农业农村部'
    };
    return map[role] || role;
  };

  const handleApprove = async (values: any) => {
    if (!selectedWarning) return;
    
    try {
      const currentStep = selectedWarning.currentStep + 1;
      const role = user?.role || '';
      const operatorId = user?.id || '';
      
      const res = await approveWarningStep(selectedWarning.id, {
        step: currentStep,
        role,
        operatorId,
        comment: values.comment
      });
      
      if (res.success) {
        message.success('审批成功');
        setApproveVisible(false);
        form.resetFields();
        loadWarnings();
      } else {
        message.error('审批失败');
      }
    } catch (err) {
      message.error('审批失败，请重试');
    }
  };

  const canApprove = (warning: Warning) => {
    if (!user) return false;
    
    const stepRoles: Record<number, string> = {
      0: 'enterprise',
      1: 'provincial',
      2: 'national'
    };
    
    const requiredRole = stepRoles[warning.currentStep];
    return user.role === requiredRole || user.role === 'national';
  };

  const columns: ColumnsType<Warning> = [
    {
      title: '预警级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => (
        <Badge 
          status={level === 'primary' ? 'error' : 'warning'} 
          text={level === 'primary' ? '一级预警' : '二级预警'}
        />
      )
    },
    {
      title: '预警类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag icon={<WarningOutlined />} color={type === 'grain_ratio' ? 'red' : 'orange'}>
          {getWarningTypeText(type)}
        </Tag>
      )
    },
    {
      title: '涉及省份',
      dataIndex: 'province',
      key: 'province',
      width: 120,
    },
    {
      title: '预警描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '触发时间',
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            onClick={() => {
              setSelectedWarning(record);
              setDetailVisible(true);
            }}
          >
            查看详情
          </Button>
          {canApprove(record) && (
            <Button 
              type="primary" 
              size="small"
              icon={<CheckOutlined />}
              onClick={() => {
                setSelectedWarning(record);
                setApproveVisible(true);
              }}
            >
              审批
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0">智能预警中心</h1>
          <p className="text-gray-500 mt-1 m-0">实时监控产业风险，及时预警处置</p>
        </div>
        <Button type="primary" onClick={loadWarnings}>刷新数据</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="text-center rounded-xl border-0 bg-red-50">
            <Statistic
              title={<span className="text-red-700">一级预警</span>}
              value={warnings.filter(w => w.level === 'primary').length}
              valueStyle={{ color: '#dc2626' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center rounded-xl border-0 bg-orange-50">
            <Statistic
              title={<span className="text-orange-700">待处理</span>}
              value={warnings.filter(w => w.status === 'pending' || w.status === 'confirmed').length}
              valueStyle={{ color: '#ea580c' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center rounded-xl border-0 bg-green-50">
            <Statistic
              title={<span className="text-green-700">已处理</span>}
              value={warnings.filter(w => w.status === 'resolved' || w.status === 'approved').length}
              valueStyle={{ color: '#16a34a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="rounded-xl border-0">
        <Table
          columns={columns}
          dataSource={warnings}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="预警详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
        width={700}
      >
        {selectedWarning && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Badge 
                status={selectedWarning.level === 'primary' ? 'error' : 'warning'} 
                text={<span className="font-bold text-lg">
                  {selectedWarning.level === 'primary' ? '一级预警' : '二级预警'}
                </span>}
              />
              <Tag color={selectedWarning.type === 'grain_ratio' ? 'red' : 'orange'}>
                {getWarningTypeText(selectedWarning.type)}
              </Tag>
              <span className="text-gray-500 ml-auto">
                {new Date(selectedWarning.triggeredAt).toLocaleString()}
              </span>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">预警描述</h4>
              <p className="text-gray-600">{selectedWarning.description}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-4">审批进度</h4>
              <Timeline
                items={selectedWarning.approvalFlow?.map(step => ({
                  color: step.status === 'approved' ? 'green' : step.status === 'rejected' ? 'red' : 'gray',
                  dot: step.status === 'approved' ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
                  children: (
                    <div className="pb-2">
                      <p className="font-medium text-gray-800 m-0">
                        {getRoleText(step.role)}
                        <Tag color={step.status === 'approved' ? 'green' : step.status === 'rejected' ? 'red' : 'default'} className="ml-2">
                          {step.status === 'approved' ? '已通过' : step.status === 'rejected' ? '已拒绝' : '待处理'}
                        </Tag>
                      </p>
                      {step.comment && <p className="text-gray-600 text-sm mt-1 m-0">意见：{step.comment}</p>}
                      {step.operatorName && <p className="text-gray-500 text-xs mt-1 m-0">操作人：{step.operatorName} · {step.operatedAt && new Date(step.operatedAt).toLocaleString()}</p>}
                    </div>
                  )
                })) || []}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="审批预警"
        open={approveVisible}
        onCancel={() => setApproveVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setApproveVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            确认审批
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="comment"
            label="审批意见"
            rules={[{ required: true, message: '请输入审批意见' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入审批意见" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WarningCenter;
