
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Alert, Spin, Select, Upload, message, Progress, Tag } from 'antd';
import { 
  LineChartOutlined, 
  RiseOutlined, 
  UploadOutlined,
  ThunderboltOutlined,
  FileExcelOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useStore } from '../store/useStore';
import { getForecast, generateForecast, uploadExcel } from '../services/api';

const { Option } = Select;

const Forecast: React.FC = () => {
  const { forecast, setForecast, user } = useStore();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>();

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const res = await getForecast(selectedProvince);
      if (res.success && res.data) {
        setForecast(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateForecast(selectedProvince);
      if (res.success && res.data) {
        setForecast(res.data);
        message.success('预测生成成功');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const res = await uploadExcel(file);
      if (res.success) {
        message.success('文件上传成功，已提取关键参数');
        handleGenerate();
      }
      return false;
    } catch (err) {
      message.error('文件上传失败');
      return false;
    }
  };

  const supplyOption = forecast ? {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['预测供应量', '供应缺口'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: forecast.months
    },
    yAxis: [
      {
        type: 'value',
        name: '供应量(万头)',
        position: 'left'
      },
      {
        type: 'value',
        name: '缺口(万头)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '预测供应量',
        type: 'bar',
        data: forecast.supplyForecast,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#22c55e' },
              { offset: 1, color: '#16a34a' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '供应缺口',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: forecast.supplyGap,
        lineStyle: {
          width: 3,
          color: '#f97316'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(249, 115, 22, 0.3)' },
              { offset: 1, color: 'rgba(249, 115, 22, 0.05)' }
            ]
          }
        }
      }
    ]
  } : {};

  const costOption = forecast ? {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['饲料成本预测'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: forecast.months
    },
    yAxis: {
      type: 'value',
      name: '成本(元/公斤)'
    },
    series: [
      {
        name: '饲料成本预测',
        type: 'line',
        smooth: true,
        data: forecast.feedCostForecast,
        lineStyle: {
          width: 3,
          color: '#3b82f6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        },
        markPoint: {
          data: [
            { type: 'max', name: '最高' },
            { type: 'min', name: '最低' }
          ]
        }
      }
    ]
  } : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0">预测分析中心</h1>
          <p className="text-gray-500 mt-1 m-0">智能预测生猪供应走势，辅助养殖决策</p>
        </div>
        <div className="flex gap-3">
          <Select
            placeholder="选择省份"
            style={{ width: 150 }}
            allowClear
            onChange={setSelectedProvince}
          >
            <Option value="河南省">河南省</Option>
            <Option value="山东省">山东省</Option>
            <Option value="四川省">四川省</Option>
          </Select>
          <Upload
            beforeUpload={handleUpload}
            showUploadList={false}
            accept=".xlsx,.xls"
          >
            <Button icon={<UploadOutlined />}>
              上传Excel数据
            </Button>
          </Upload>
          <Button 
            type="primary" 
            icon={<ThunderboltOutlined />}
            loading={generating}
            onClick={handleGenerate}
          >
            重新生成预测
          </Button>
        </div>
      </div>

      <Alert
        message="提示"
        description="上传能繁母猪存栏调查Excel和饲料价格表，系统将自动提取关键参数进行预测分析"
        type="info"
        showIcon
        className="rounded-lg"
      />

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Spin size="large" tip="正在加载预测数据..." />
        </div>
      ) : forecast ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <span className="flex items-center gap-2">
                    <LineChartOutlined className="text-green-600" />
                    未来3个月生猪供应预测
                  </span>
                } 
                className="rounded-xl border-0"
                extra={
                  <Tag color="green">
                    置信度: <Progress 
                      type="circle" 
                      percent={Math.round(forecast.confidence * 100)} 
                      size="small" 
                    />
                  </Tag>
                }
              >
                <div style={{ height: 350 }}>
                  <ReactECharts option={supplyOption} style={{ height: '100%' }} />
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <span className="flex items-center gap-2">
                    <RiseOutlined className="text-blue-600" />
                    策略推荐
                  </span>
                } 
                className="rounded-xl border-0 h-full"
              >
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <CheckCircleOutlined className="text-green-600 text-xl mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-800 m-0 mb-2">推荐策略</h4>
                        <p className="text-green-700 text-sm m-0">{forecast.recommendedStrategy}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 m-0">关键指标</h4>
                    {forecast.months.map((month, idx) => (
                      <div key={month} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">{month}</span>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800 m-0">{forecast.supplyForecast[idx]} 万头</p>
                          <p className={`text-sm m-0 ${forecast.supplyGap[idx] > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            缺口: {forecast.supplyGap[idx] > 0 ? '+' : ''}{forecast.supplyGap[idx]} 万头
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card 
                title={
                  <span className="flex items-center gap-2">
                    <LineChartOutlined className="text-blue-600" />
                    饲料成本走势预测
                  </span>
                } 
                className="rounded-xl border-0"
              >
                <div style={{ height: 300 }}>
                  <ReactECharts option={costOption} style={{ height: '100%' }} />
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={10}>
              <Card 
                title={
                  <span className="flex items-center gap-2">
                    <FileExcelOutlined className="text-purple-600" />
                    数据上传记录
                  </span>
                } 
                className="rounded-xl border-0"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileExcelOutlined className="text-green-600 text-xl" />
                      <div>
                        <p className="font-medium text-gray-800 m-0">能繁母猪存栏调查.xlsx</p>
                        <p className="text-xs text-gray-500 m-0">2026-06-01 上传</p>
                      </div>
                    </div>
                    <Tag color="green">已处理</Tag>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileExcelOutlined className="text-green-600 text-xl" />
                      <div>
                        <p className="font-medium text-gray-800 m-0">全国饲料价格表.xlsx</p>
                        <p className="text-xs text-gray-500 m-0">2026-06-03 上传</p>
                      </div>
                    </div>
                    <Tag color="green">已处理</Tag>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Card className="rounded-xl border-0 text-center py-16">
          <p className="text-gray-500">暂无预测数据，请点击"重新生成预测"生成预测报告</p>
        </Card>
      )}
    </div>
  );
};

export default Forecast;
