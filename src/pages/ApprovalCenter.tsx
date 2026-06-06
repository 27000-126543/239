
import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, message, Timeline, Space, Badge, Steps } from 'antd';
import { 
  FileSearchOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { getWarnings, approveWarningStep } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { Warning } from '../types';

const { Step } = Steps;

const ApprovalCenter: React.FC = () => {
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
        setWarnings(res.data.filter(w => w.status !== 'resolved'));
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

  const getRoleText = (role: string) => {
    const map: Record<string, string> = {
      'enterprise': '养殖场负责人',
      'provincial': '省级畜牧局',
      'national': '农业农村部'
    };
    return map[role] || role;
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

  const getStepStatus = (step: number, currentStep: number) => {
    if (step < currentStep) return 'finish';
    if (step === currentStep) return 'process';
    return 'wait';
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
          text={level === 'primary' ? '一级' : '二级'}
        />
      )
    },
    {
      title: '预警类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'grain_ratio' ? 'red' : 'orange'}>
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
      title: '审批进度',
      key: 'progress',
      width: 250,
      render: (_, record) => (
        <Steps size="small" current={record.currentStep}>
          <Step title="场长确认" />
          <Step title="省级复核" />
          <Step title="部级批准" />
        </Steps>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'approved' ? 'green' : status === 'pending' ? 'warning' : 'processing'}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
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
            查看
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
          <h1 className="text-2xl font-bold text-gray-800 m-0">审批流程中心</h1>
          <p className="text-gray-500 mt-1 m-0">三级审批流程：养殖场确认→省级复核→部级批准</p>
        </div>
        <Button type="primary" onClick={loadWarnings}>刷新</Button>
      </div>

      <Card className="rounded-xl border-0">
        <Table
          columns={columns}
          dataSource={warnings}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <div className="py-4">
                <h4 className="font-semibold text-gray-800 mb-4">收储/补贴方案建议</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-800 m-0 mb-2">启动临时收储</h5>
                    <p className="text-blue-700 text-sm m-0">
                      建议启动冻猪肉收储5万吨，稳定市场预期，缓解养殖户亏损压力。
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-800 m-0 mb-2">临时补贴方案</h5>
                    <p className="text-green-700 text-sm m-0">
                      建议对能繁母猪给予每头50元临时补贴，保护基础产能。
                    </p>
                  </div>
                </div>
              </div>
            )
          }}
        />
      </Card>

      <Modal
        title="审批详情"
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
                {selectedWarning.province}
              </span>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">预警描述</h4>
              <p className="text-gray-600">{selectedWarning.description}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-4">审批流程</h4>
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
                      {step.operatorName && <p className="text-gray-500 text-xs mt-1 m-0">操作人：{step.operatorName}</p>}
                    </div>
                  )
                })) || []}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="审批操作"
        open={approveVisible}
        onCancel={() => setApproveVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setApproveVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            确认通过
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

export default ApprovalCenter;
