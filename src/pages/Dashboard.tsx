
import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Select, Statistic, Table, Tag, Spin, Empty } from 'antd';
import { 
  RiseOutlined, 
  FallOutlined, 
  HomeOutlined, 
  ShopOutlined, 
  PercentageOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useStore } from '../store/useStore';
import { getNationalMetrics, getWarnings, getFarmData } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { CoreMetrics } from '../types';

const { Option } = Select;

const Dashboard: React.FC = () => {
  const { metrics, setMetrics, setWarnings, selectedProvince, selectedQuarter, setSelectedProvince, setSelectedQuarter, loading, setLoading } = useStore();
  const [drillDownProvince, setDrillDownProvince] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsRes, warningsRes] = await Promise.all([
        getNationalMetrics(),
        getWarnings()
      ]);
      
      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
      if (warningsRes.success && warningsRes.data) {
        setWarnings(warningsRes.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const summaryData = useMemo(() => {
    if (metrics.length === 0) return null;
    
    const totalInventory = metrics.reduce((sum, m) => sum + m.totalInventory, 0);
    const totalSlaughter = metrics.reduce((sum, m) => sum + m.totalSlaughter, 0);
    const avgFCR = metrics.reduce((sum, m) => sum + m.avgFeedConversionRatio, 0) / metrics.length;
    const avgGrainRatio = metrics.reduce((sum, m) => sum + m.avgGrainRatio, 0) / metrics.length;
    const avgChangeRate = metrics.reduce((sum, m) => sum + m.inventoryChangeRate, 0) / metrics.length;
    
    return {
      totalInventory,
      totalSlaughter,
      avgFCR: avgFCR.toFixed(2),
      avgGrainRatio: avgGrainRatio.toFixed(2),
      avgChangeRate: avgChangeRate.toFixed(2)
    };
  }, [metrics]);

  const heatMapOption = useMemo(() => {
    const data = metrics.map(m => [m.province.replace(/省|市|自治区|壮族自治区|回族自治区|维吾尔自治区/g, ''), m.totalInventory]);
    const maxValue = Math.max(...metrics.map(m => m.totalInventory));
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}<br/>生猪存栏: ${params.value?.toLocaleString() || 0} 头`
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        calculable: true,
        inRange: {
          color: ['#e8f5e9', '#a5d6a7', '#4caf50', '#2e7d32', '#1b5e20']
        }
      },
      series: [
        {
          name: '生猪存栏量',
          type: 'map',
          map: 'china',
          roam: false,
          emphasis: {
            label: {
              show: true,
              color: '#fff'
            },
            itemStyle: {
              areaColor: '#166534'
            }
          },
          data: data
        }
      ]
    };
  }, [metrics]);

  const priceRankColumns: ColumnsType<CoreMetrics> = [
    {
      title: '排名',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Tag color={index < 3 ? 'red' : 'default'} className="font-bold">
          {index + 1}
        </Tag>
      )
    },
    {
      title: '省份',
      dataIndex: 'province',
      key: 'province',
    },
    {
      title: '生猪存栏（头）',
      dataIndex: 'totalInventory',
      key: 'totalInventory',
      sorter: (a, b) => a.totalInventory - b.totalInventory,
      render: (val: number) => val.toLocaleString()
    },
    {
      title: '猪粮比价',
      dataIndex: 'avgGrainRatio',
      key: 'avgGrainRatio',
      sorter: (a, b) => a.avgGrainRatio - b.avgGrainRatio,
      render: (val: number) => (
        <span className={val < 5 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
          {val.toFixed(2)}:1
        </span>
      )
    },
    {
      title: '存栏变化率',
      dataIndex: 'inventoryChangeRate',
      key: 'inventoryChangeRate',
      render: (val: number) => (
        <span className={`flex items-center gap-1 ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {val >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {Math.abs(val).toFixed(2)}%
        </span>
      )
    }
  ];

  const trendOption = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(`${d.getMonth() + 1}/${d.getDate()}`);
    }
    
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['出栏量', '疫病阳性率'],
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
        boundaryGap: false,
        data: days
      },
      yAxis: [
        {
          type: 'value',
          name: '出栏量',
          position: 'left'
        },
        {
          type: 'value',
          name: '阳性率(%)',
          position: 'right',
          max: 5
        }
      ],
      series: [
        {
          name: '出栏量',
          type: 'line',
          smooth: true,
          data: [3200, 3800, 3600, 4200, 3900, 4500, 4800],
          lineStyle: {
            width: 3,
            color: '#16a34a'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(22, 163, 74, 0.3)' },
                { offset: 1, color: 'rgba(22, 163, 74, 0.05)' }
              ]
            }
          }
        },
        {
          name: '疫病阳性率',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: [1.2, 1.5, 1.3, 1.8, 1.6, 2.1, 1.9],
          lineStyle: {
            width: 3,
            color: '#f97316'
          }
        }
      ]
    };
  }, [drillDownProvince]);

  const diseaseDistributionOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item'
      },
      series: [
        {
          name: '疫病类型分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}: {d}%'
          },
          data: [
            { value: 35, name: '非洲猪瘟', itemStyle: { color: '#ef4444' } },
            { value: 25, name: '蓝耳病', itemStyle: { color: '#f97316' } },
            { value: 20, name: '猪瘟', itemStyle: { color: '#eab308' } },
            { value: 12, name: '口蹄疫', itemStyle: { color: '#22c55e' } },
            { value: 8, name: '其他', itemStyle: { color: '#3b82f6' } }
          ]
        }
      ]
    };
  }, []);

  const sortedMetrics = useMemo(() => {
    return [...metrics].sort((a, b) => b.totalInventory - a.totalInventory);
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="数据加载中..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0">全国生猪产业链监测</h1>
          <p className="text-gray-500 mt-1 m-0">实时监测全国生猪产业运行态势</p>
        </div>
        <div className="flex gap-3">
          <Select 
            value={selectedProvince} 
            onChange={setSelectedProvince}
            style={{ width: 150 }}
          >
            <Option value="全国">全国</Option>
            {['河南省', '山东省', '四川省', '湖南省', '广东省'].map(p => (
              <Option key={p} value={p}>{p}</Option>
            ))}
          </Select>
          <Select 
            value={selectedQuarter} 
            onChange={setSelectedQuarter}
            style={{ width: 120 }}
          >
            <Option value="2026Q1">2026 Q1</Option>
            <Option value="2026Q2">2026 Q2</Option>
            <Option value="2026Q3">2026 Q3</Option>
            <Option value="2026Q4">2026 Q4</Option>
          </Select>
        </div>
      </div>

      {summaryData && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow rounded-xl border-0">
              <Statistic
                title={
                  <span className="text-gray-600 flex items-center gap-2">
                    <HomeOutlined className="text-green-600" />
                    全国生猪存栏
                  </span>
                }
                value={summaryData.totalInventory}
                suffix="万头"
                valueStyle={{ color: '#16a34a', fontWeight: 'bold' }}
                className="dashboard-stat"
              />
              <div className="mt-2 flex items-center text-sm">
                <Tag color="green" icon={<RiseOutlined />}>
                  环比 +{summaryData.avgChangeRate}%
                </Tag>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow rounded-xl border-0">
              <Statistic
                title={
                  <span className="text-gray-600 flex items-center gap-2">
                    <ShopOutlined className="text-blue-600" />
                    本期出栏量
                  </span>
                }
                value={summaryData.totalSlaughter}
                suffix="万头"
                valueStyle={{ color: '#2563eb', fontWeight: 'bold' }}
              />
              <div className="mt-2 flex items-center text-sm">
                <Tag color="blue" icon={<RiseOutlined />}>
                  同比 +5.2%
                </Tag>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow rounded-xl border-0">
              <Statistic
                title={
                  <span className="text-gray-600 flex items-center gap-2">
                    <PercentageOutlined className="text-orange-600" />
                    平均料肉比
                  </span>
                }
                value={summaryData.avgFCR}
                suffix=":1"
                valueStyle={{ color: '#ea580c', fontWeight: 'bold' }}
              />
              <div className="mt-2 flex items-center text-sm">
                <Tag color="green" icon={<FallOutlined />}>
                  优于行业平均
                </Tag>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow rounded-xl border-0">
              <Statistic
                title={
                  <span className="text-gray-600 flex items-center gap-2">
                    <DollarOutlined className="text-purple-600" />
                    全国猪粮比价
                  </span>
                }
                value={summaryData.avgGrainRatio}
                suffix=":1"
                valueStyle={{ 
                  color: Number(summaryData.avgGrainRatio) < 5 ? '#dc2626' : '#16a34a', 
                  fontWeight: 'bold' 
                }}
              />
              <div className="mt-2 flex items-center text-sm">
                <Tag color={Number(summaryData.avgGrainRatio) < 5 ? 'red' : 'green'}>
                  {Number(summaryData.avgGrainRatio) < 5 ? '低于盈亏平衡点' : '盈利区间'}
                </Tag>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card 
            title="全国生猪存栏热力图" 
            className="rounded-xl border-0"
            extra={<span className="text-sm text-gray-500">点击省份可下钻查看详情</span>}
          >
            <div style={{ height: 450 }}>
              {metrics.length > 0 ? (
                <ReactECharts 
                  option={heatMapOption} 
                  style={{ height: '100%' }}
                  onEvents={{
                    click: (params: any) => {
                      setDrillDownProvince(params.name);
                    }
                  }}
                />
              ) : (
                <Empty description="暂无数据" />
              )}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={10}>
          <Card title="各省份生猪存栏排名" className="rounded-xl border-0 h-full">
            <Table
              columns={priceRankColumns}
              dataSource={sortedMetrics}
              rowKey="id"
              pagination={{ pageSize: 6, showSizeChanger: false }}
              size="small"
              scroll={{ y: 380 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card 
            title={drillDownProvince ? `${drillDownProvince}近7天出栏趋势` : '全国近7天出栏趋势'} 
            className="rounded-xl border-0"
            extra={
              drillDownProvince ? (
                <a onClick={() => setDrillDownProvince(null)} className="text-green-600 cursor-pointer">
                  返回全国
                </a>
              ) : null
            }
          >
            <div style={{ height: 300 }}>
              <ReactECharts option={trendOption} style={{ height: '100%' }} />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={10}>
          <Card title="疫病检测阳性率分布" className="rounded-xl border-0">
            <div style={{ height: 300 }}>
              <ReactECharts option={diseaseDistributionOption} style={{ height: '100%' }} />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
