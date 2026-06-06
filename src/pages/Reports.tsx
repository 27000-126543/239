
import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Modal, Descriptions, message } from 'antd';
import { 
  FileTextOutlined, 
  DownloadOutlined, 
  EyeOutlined,
  CalendarOutlined,
  RiseOutlined,
  WarningOutlined,
  DollarOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { getWeeklyReports } from '../services/api';
import type { WeeklyReport } from '../types';

const Reports: React.FC = () => {
  const { reports, setReports } = useStore();
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await getWeeklyReports();
      if (res.success && res.data) {
        setReports(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (report: WeeklyReport) => {
    message.success('报告下载中...');
  };

  const handleView = (report: WeeklyReport) => {
    setSelectedReport(report);
    setDetailVisible(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0">报告自动生成</h1>
          <p className="text-gray-500 mt-1 m-0">每周自动生成产业健康诊断报告</p>
        </div>
        <Button type="primary" onClick={loadReports}>刷新</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="text-center rounded-xl border-0 bg-blue-50">
            <Statistic
              title={<span className="text-blue-700">本周报告</span>}
              value={reports.length}
              suffix="份"
              valueStyle={{ color: '#2563eb' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center rounded-xl border-0 bg-green-50">
            <Statistic
              title={<span className="text-green-700">平均存栏同比</span>}
              value={reports.length > 0 ? (reports.reduce((sum, r) => sum + r.inventoryYoY, 0) / reports.length).toFixed(2) : 0}
              suffix="%"
              valueStyle={{ color: '#16a34a' }}
              prefix={<TrendingUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center rounded-xl border-0 bg-orange-50">
            <Statistic
              title={<span className="text-orange-700">平均疫病发生率</span>}
              value={reports.length > 0 ? (reports.reduce((sum, r) => sum + r.diseaseRate, 0) / reports.length).toFixed(2) : 0}
              suffix="%"
              valueStyle={{ color: '#ea580c' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="rounded-xl border-0">
        <List
          loading={loading}
          itemLayout="vertical"
          size="large"
          dataSource={reports}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button 
                  type="link" 
                  icon={<EyeOutlined />}
                  onClick={() => handleView(item)}
                >
                  查看详情
                </Button>,
                <Button 
                  type="link" 
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(item)}
                >
                  下载PDF
                </Button>
              ]}
              extra={
                <div className="hidden md:block">
                  <Tag color="green">已生成</Tag>
                </div>
              }
            >
              <List.Item.Meta
                title={
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                      <FileTextOutlined className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 m-0">
                        全国生猪产业健康诊断报告 - {item.week}
                      </h3>
                      <p className="text-gray-500 text-sm m-0">
                        <CalendarOutlined className="mr-1" />
                        生成时间: {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                }
                description={
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUpOutlined className="text-green-600" />
                      <span className="text-gray-600">存栏同比: <span className="font-medium text-gray-800">+{item.inventoryYoY}%</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <WarningOutlined className="text-orange-600" />
                      <span className="text-gray-600">疫病发生率: <span className="font-medium text-gray-800">{item.diseaseRate}%</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarOutlined className="text-blue-600" />
                      <span className="text-gray-600">包含成本利润分析</span>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="产业健康诊断报告详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />}>
            下载PDF
          </Button>
        ]}
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b">
              <h2 className="text-xl font-bold text-gray-800 m-0">
                全国生猪产业健康诊断报告
              </h2>
              <p className="text-gray-500 mt-1 m-0">{selectedReport.week}</p>
            </div>

            <Descriptions bordered column={2}>
              <Descriptions.Item label="存栏同比变化" span={1}>
                <span className={selectedReport.inventoryYoY >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {selectedReport.inventoryYoY >= 0 ? '+' : ''}{selectedReport.inventoryYoY}%
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="疫病发生率" span={1}>
                <span className={selectedReport.diseaseRate > 2 ? 'text-red-600' : 'text-green-600'}>
                  {selectedReport.diseaseRate}%
                </span>
              </Descriptions.Item>
            </Descriptions>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <DollarOutlined className="text-green-600" />
                养殖成本利润分析
              </h4>
              <p className="text-gray-600 m-0">{selectedReport.costProfitAnalysis}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <BulbOutlined />
                调整建议
              </h4>
              <ul className="space-y-2 m-0 pl-5">
                {selectedReport.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-green-700">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
