
import React, { useState } from 'react';
import { 
  Row, Col, Card, Upload, Button, Tabs, Table, 
  Alert, message, Progress, Statistic, Tag, Space, Divider
} from 'antd';
import { 
  UploadOutlined, 
  FileExcelOutlined, 
  CheckCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useStore } from '../store/useStore';
import { uploadExcel, generateForecast, getForecast } from '../services/api';
import type { ForecastResult } from '../types';
import ReactECharts from 'echarts-for-react';

const { TabPane } = Tabs;

const DataUpload: React.FC = () => {
  const { loading, setLoading } = useStore();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);

  const sowUploadProps: UploadProps = {
    name: 'file',
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        message.error('只能上传Excel文件!');
        return false;
      }
      handleUpload(file, 'sow');
      return false;
    }
  };

  const feedUploadProps: UploadProps = {
    name: 'file',
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        message.error('只能上传Excel文件!');
        return false;
      }
      handleUpload(file, 'feed');
      return false;
    }
  };

  const handleUpload = async (file: File, type: string) => {
    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const res = await uploadExcel(formData);
      if (res.success && res.data) {
        setUploadedFile(file);
        setExtractedData(res.data);
        message.success('文件上传成功，数据已提取');
      } else {
        message.error(res.message || '上传失败');
      }
    } catch (err) {
      console.error('上传失败:', err);
      message.error('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateForecast = async () => {
    setLoading(true);
    try {
      const genRes = await generateForecast();
      if (genRes.success) {
        const res = await getForecast();
        if (res.success && res.data) {
          setForecastResult(res.data);
          message.success('预测分析完成');
        }
      }
    } catch (err) {
      console.error('预测失败:', err);
      message.error('预测分析失败');
    } finally {
      setLoading(false);
    }
  };

  const sowColumns = [
    { title: '省份', dataIndex: 'province', key: 'province' },
    { title: '能繁母猪存栏(万头)', dataIndex: 'sowCount', key: 'sowCount' },
    { title: '环比变化(%)', dataIndex: 'changeRate', key: 'changeRate',
      render: (val: number) => (
        <Tag color={val >= 0 ? 'green' : 'red'}>{val >= 0 ? '+' : ''}{val}%</Tag>
      )
    },
    { title: '数据来源', dataIndex: 'source', key: 'source' }
  ];

  const feedColumns = [
    { title: '饲料类型', dataIndex: 'feedType', key: 'feedType' },
    { title: '价格(元/吨)', dataIndex: 'price', key: 'price',
      render: (val: number) => <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{val}</span>
    },
    { title: '环比变化(%)', dataIndex: 'changeRate', key: 'changeRate',
      render: (val: number) => (
        <Tag color={val >= 0 ? 'red' : 'green'}>{val >= 0 ? '+' : ''}{val}%</Tag>
      )
    },
    { title: '主要产区', dataIndex: 'region', key: 'region' }
  ];

  const supplyForecastOption = forecastResult ? {
    title: { text: '未来3个月生猪供应预测', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['预测供应量', '潜在缺口'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: forecastResult.monthlyForecast.map(item => item.month)
    },
    yAxis: [
      { type: 'value', name: '万头' },
      { type: 'value', name: '万头', position: 'right' }
    ],
    series: [
      {
        name: '预测供应量',
        type: 'bar',
        data: forecastResult.monthlyForecast.map(item => item.supply),
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '潜在缺口',
        type: 'line',
        yAxisIndex: 1,
        data: forecastResult.monthlyForecast.map(item => item.gap),
        itemStyle: { color: '#ff4d4f' },
        smooth: true
      }
    ]
  } : {};

  const feedCostOption = forecastResult ? {
    title: { text: '饲料成本走势预测', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['玉米价格', '豆粕价格', '配合料价格'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: forecastResult.feedCostForecast.map(item => item.month)
    },
    yAxis: { type: 'value', name: '元/吨' },
    series: [
      {
        name: '玉米价格',
        type: 'line',
        smooth: true,
        data: forecastResult.feedCostForecast.map(item => item.corn),
        itemStyle: { color: '#fa8c16' }
      },
      {
        name: '豆粕价格',
        type: 'line',
        smooth: true,
        data: forecastResult.feedCostForecast.map(item => item.soybean),
        itemStyle: { color: '#722ed1' }
      },
      {
        name: '配合料价格',
        type: 'line',
        smooth: true,
        data: forecastResult.feedCostForecast.map(item => item.feed),
        itemStyle: { color: '#1890ff' }
      }
    ]
  } : {};

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card 
            title={
              <Space>
                <FileExcelOutlined style={{ color: '#52c41a' }} />
                能繁母猪存栏调查数据上传
              </Space>
            }
            extra={
              <Tag color="green">.xlsx / .xls</Tag>
            }
          >
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Upload {...sowUploadProps}>
                <Button 
                  type="primary" 
                  icon={<UploadOutlined />} 
                  size="large"
                  loading={uploading}
                >
                  选择文件上传
                </Button>
              </Upload>
              <p style={{ marginTop: 16, color: '#666' }}>
                请上传包含各省份能繁母猪存栏数据的Excel文件
              </p>
              {uploading && (
                <Progress percent={uploadProgress} status="active" style={{ marginTop: 16 }} />
              )}
              {uploadedFile && (
                <Alert
                  icon={<CheckCircleOutlined />}
                  message={`已上传: ${uploadedFile.name}`}
                  type="success"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={
              <Space>
                <FileExcelOutlined style={{ color: '#1890ff' }} />
                饲料价格表上传
              </Space>
            }
            extra={
              <Tag color="blue">.xlsx / .xls</Tag>
            }
          >
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Upload {...feedUploadProps}>
                <Button 
                  type="primary" 
                  icon={<UploadOutlined />} 
                  size="large"
                  loading={uploading}
                >
                  选择文件上传
                </Button>
              </Upload>
              <p style={{ marginTop: 16, color: '#666' }}>
                请上传包含玉米、豆粕、配合料价格数据的Excel文件
              </p>
              {uploading && (
                <Progress percent={uploadProgress} status="active" style={{ marginTop: 16 }} />
              )}
              {extractedData && (
                <Alert
                  icon={<CheckCircleOutlined />}
                  message="数据提取成功"
                  description={`已提取 ${extractedData.recordCount || 0} 条记录`}
                  type="success"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {extractedData && (
        <Card 
          title={
            <Space>
              <DatabaseOutlined />
              已提取数据预览
            </Space>
          } 
          style={{ marginTop: 16 }}
        >
          <Tabs defaultActiveKey="sow">
            <TabPane tab="能繁母猪存栏数据" key="sow">
              <Table
                columns={sowColumns}
                dataSource={extractedData.sowData || []}
                rowKey="province"
                pagination={false}
                size="small"
              />
            </TabPane>
            <TabPane tab="饲料价格数据" key="feed">
              <Table
                columns={feedColumns}
                dataSource={extractedData.feedData || []}
                rowKey="feedType"
                pagination={false}
                size="small"
              />
            </TabPane>
          </Tabs>
          <Divider />
          <div style={{ textAlign: 'center' }}>
            <Button 
              type="primary" 
              size="large"
              icon={<BarChartOutlined />}
              onClick={handleGenerateForecast}
              loading={loading}
            >
              生成预测分析报告
            </Button>
          </div>
        </Card>
      )}

      {forecastResult && (
        <>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="预计供应缺口"
                  value={forecastResult.supplyGap}
                  suffix="万头"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="饲料成本涨幅"
                  value={forecastResult.feedCostIncrease}
                  suffix="%"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="预计均价"
                  value={forecastResult.expectedPrice}
                  suffix="元/kg"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="推荐策略"
                  value={forecastResult.recommendation}
                  valueStyle={{ color: '#1890ff', fontSize: 16 }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Card>
                <ReactECharts option={supplyForecastOption} style={{ height: 350 }} />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <ReactECharts option={feedCostOption} style={{ height: 350 }} />
              </Card>
            </Col>
          </Row>

          <Card 
            title={
              <Space>
                <FileTextOutlined />
                智能策略推荐
              </Space>
            } 
            style={{ marginTop: 16 }}
          >
            <Alert
              message={forecastResult.strategy}
              type="info"
              showIcon
              description={
                <div>
                  <p><strong>补栏建议：</strong>{forecastResult.suggestion?.restocking || '暂无'}</p>
                  <p><strong>压栏建议：</strong>{forecastResult.suggestion?.holding || '暂无'}</p>
                  <p><strong>风险提示：</strong>{forecastResult.suggestion?.risk || '暂无'}</p>
                </div>
              }
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default DataUpload;
