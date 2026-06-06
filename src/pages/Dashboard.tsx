import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Row, Col, Card, Select, Statistic, Table, Tag, Spin, Empty, Modal, Button, message } from 'antd';
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
import * as echarts from 'echarts';
import { useStore } from '../store/useStore';
import { getNationalMetrics, getWarnings, getFarmData, getSlaughterData, getMarketData } from '../services/api';
import { chinaGeoJSON, provinceNameMap } from '../data/chinaMap';
import type { ColumnsType } from 'antd/es/table';
import type { CoreMetrics, FarmData } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;

echarts.registerMap('china', chinaGeoJSON as any);

const Dashboard: React.FC = () => {
  const { user, loading, setLoading } = useStore();
  const [allMetrics, setAllMetrics] = useState<CoreMetrics[]>([]);
  const [filteredMetrics, setFilteredMetrics] = useState<CoreMetrics[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('全国');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [drillDownProvince, setDrillDownProvince] = useState<string | null>(null);
  const [drillDownModalVisible, setDrillDownModalVisible] = useState(false);
  const [farmData, setFarmData] = useState<FarmData[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [metricsRes, warningsRes, farmRes] = await Promise.all([
        getNationalMetrics(),
        getWarnings(),
        getFarmData()
      ]);
      
      if (metricsRes.success && metricsRes.data) {
        setAllMetrics(metricsRes.data);
        setFilteredMetrics(getLatestByProvince(metricsRes.data));
      }
      if (farmRes.success && farmRes.data) {
        setFarmData(farmRes.data);
      }
    } catch (err) {
      message.error('数据加载失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLatestByProvince = (data: CoreMetrics[]): CoreMetrics[] => {
    const latestMap: Record<string, CoreMetrics> = {};
    data.forEach(m => {
      if (!latestMap[m.province] || dayjs(m.calculateDate).isAfter(dayjs(latestMap[m.province].calculateDate))) {
        latestMap[m.province] = m;
      }
    });
    return Object.values(latestMap);
  };

  useEffect(() => {
    let result = [...allMetrics];
    
    if (selectedProvince !== '全国') {
      result = result.filter(m => 
        m.province === selectedProvince || 
        m.province.includes(selectedProvince) ||
        provinceNameMap[m.province] === selectedProvince
      );
    }
    
    if (selectedQuarter) {
      const [year, q] = selectedQuarter.split('Q');
      const quarterNum = parseInt(q);
      const startMonth = (quarterNum - 1) * 3 + 1;
      const endMonth = quarterNum * 3;
      
      result = result.filter(m => {
        const date = dayjs(m.calculateDate);
        return date.year() === parseInt(year) && 
               date.month() + 1 >= startMonth && 
               date.month() + 1 <= endMonth;
      });
    }
    
    setFilteredMetrics(getLatestByProvince(result));
  }, [selectedProvince, selectedQuarter, allMetrics]);

  const summaryData = useMemo(() => {
    if (filteredMetrics.length === 0) return null;
    
    const totalInventory = filteredMetrics.reduce((sum, m) => sum + m.totalInventory, 0);
    const totalSlaughter = filteredMetrics.reduce((sum, m) => sum + m.totalSlaughter, 0);
    const avgFCR = filteredMetrics.length > 0 
      ? (filteredMetrics.reduce((sum, m) => sum + m.avgFeedConversionRatio, 0) / filteredMetrics.length).toFixed(2)
      : '0';
    const avgGrainRatio = filteredMetrics.length > 0
      ? (filteredMetrics.reduce((sum, m) => sum + m.avgGrainRatio, 0) / filteredMetrics.length).toFixed(2)
      : '0';
    const avgChangeRate = filteredMetrics.length > 0
      ? (filteredMetrics.reduce((sum, m) => sum + m.inventoryChangeRate, 0) / filteredMetrics.length).toFixed(2)
      : '0';
    
    return {
      totalInventory: Math.round(totalInventory / 10000),
      totalSlaughter: Math.round(totalSlaughter / 10000),
      avgFCR,
      avgGrainRatio,
      avgChangeRate
    };
  }, [filteredMetrics]);

  const heatMapOption = useMemo(() => {
    const data = filteredMetrics.map(m => {
      const shortName = provinceNameMap[m.province] || 
                        m.province.replace(/省|市|自治区|壮族自治区|回族自治区|维吾尔自治区|特别行政区/g, '');
      return {
        name: shortName,
        value: m.totalInventory
      };
    });
    
    const maxValue = Math.max(...filteredMetrics.map(m => m.totalInventory), 1);
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.value) {
            return `${params.name}<br/>生猪存栏: ${(params.value / 10000).toFixed(2)} 万头`;
          }
          return params.name;
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        calculable: true,
        inRange: {
          color: ['#f0fdf4', '#86efac', '#22c55e', '#16a34a', '#15803d', '#14532d']
        }
      },
      series: [
        {
          name: '生猪存栏量',
          type: 'map',
          map: 'china',
          roam: true,
          zoom: 1.1,
          scaleLimit: { min: 0.8, max: 3 },
          label: {
            show: true,
            fontSize: 9,
            color: '#333'
          },
          emphasis: {
            label: {
              show: true,
              color: '#fff',
              fontSize: 11,
              fontWeight: 'bold'
            },
            itemStyle: {
              areaColor: '#15803d',
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.3)'
            }
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          },
          data: data
        }
      ]
    };
  }, [filteredMetrics]);

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
      title: '生猪存栏（万头）',
      dataIndex: 'totalInventory',
      key: 'totalInventory',
      sorter: (a, b) => a.totalInventory - b.totalInventory,
      render: (val: number) => (val / 10000).toFixed(2)
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

  const drillDownTrendOption = useMemo(() => {
    if (!drillDownProvince) return {};
    
    const provinceFarmData = farmData.filter(f => 
      f.province === drillDownProvince || 
      f.province?.includes(drillDownProvince) ||
      provinceNameMap[f.province] === drillDownProvince
    );
    
    if (provinceFarmData.length === 0) return {};
    
    const allDates = Array.from(new Set(provinceFarmData.map(f => f.reportDate))).sort().slice(-7);
    const cities = Array.from(new Set(provinceFarmData.map(f => f.city || '未知')));
    
    const colors = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e'];
    
    return {
      title: {
        text: '各地市近7天出栏趋势',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].axisValue + '<br/>';
          params.forEach((p: any) => {
            result += `${p.marker} ${p.seriesName}: ${p.value}头<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: cities,
        top: 25,
        type: 'scroll'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 60,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: allDates,
        axisLabel: { rotate: 30, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: '出栏量(头)'
      },
      series: cities.map((city, idx) => ({
        name: city,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: allDates.map(date => {
          const dayData = provinceFarmData.filter(f => f.reportDate === date && (f.city || '未知') === city);
          return dayData.reduce((sum, d) => sum + d.slaughter, 0);
        }),
        lineStyle: {
          width: 2,
          color: colors[idx % colors.length]
        },
        itemStyle: {
          color: colors[idx % colors.length]
        }
      }))
    };
  }, [drillDownProvince, farmData]);

  const drillDownDiseaseOption = useMemo(() => {
    if (!drillDownProvince) return {};
    
    const provinceFarmData = farmData.filter(f => 
      f.province === drillDownProvince || 
      f.province?.includes(drillDownProvince) ||
      provinceNameMap[f.province] === drillDownProvince
    );
    
    if (provinceFarmData.length === 0) return {};
    
    const cityData: Record<string, { total: number; count: number }> = {};
    
    provinceFarmData.forEach(f => {
      const city = f.city || '未知';
      if (!cityData[city]) {
        cityData[city] = { total: 0, count: 0 };
      }
      cityData[city].total += f.diseasePositiveRate;
      cityData[city].count += 1;
    });
    
    const pieData = Object.entries(cityData).map(([city, data]) => ({
      name: city,
      value: Number((data.total / data.count).toFixed(2))
    }));
    
    return {
      title: {
        text: '各地市疫病阳性率分布',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}% ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [
        {
          name: '疫病阳性率',
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['40%', '55%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}: {c}%',
            fontSize: 11
          },
          labelLine: {
            show: true
          },
          data: pieData,
          color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899']
        }
      ]
    };
  }, [drillDownProvince, farmData]);

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
          name: '出栏量(万头)',
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
          data: [320, 380, 360, 420, 390, 450, 480],
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
  }, []);

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
    return [...filteredMetrics].sort((a, b) => b.totalInventory - a.totalInventory);
  }, [filteredMetrics]);

  const provinces = useMemo(() => {
    const provs = Array.from(new Set(allMetrics.map(m => m.province))).sort();
    return ['全国', ...provs];
  }, [allMetrics]);

  const handleMapClick = useCallback((params: any) => {
    if (params.name) {
      const provinceFullName = Object.keys(provinceNameMap).find(
        key => provinceNameMap[key] === params.name
      ) || params.name;
      setDrillDownProvince(provinceFullName);
      setDrillDownModalVisible(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="数据加载中..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0">全国生猪产业链监测</h1>
          <p className="text-gray-500 mt-1 m-0">实时监测全国生猪产业运行态势 {selectedProvince !== '全国' && `- ${selectedProvince}`}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select 
            value={selectedProvince} 
            onChange={setSelectedProvince}
            style={{ width: 150 }}
            showSearch
            placeholder="选择省份"
            size="large"
          >
            {provinces.map(p => (
              <Option key={p} value={p}>{p}</Option>
            ))}
          </Select>
          <Select 
            value={selectedQuarter} 
            onChange={setSelectedQuarter}
            style={{ width: 120 }}
            placeholder="选择季度"
            size="large"
            allowClear
          >
            <Option value="2026Q1">2026 Q1</Option>
            <Option value="2026Q2">2026 Q2</Option>
            <Option value="2025Q4">2025 Q4</Option>
          </Select>
          <Button type="primary" onClick={loadAllData} size="large">
            刷新数据
          </Button>
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
                    生猪存栏
                  </span>
                }
                value={summaryData.totalInventory}
                suffix="万头"
                valueStyle={{ color: '#16a34a', fontWeight: 'bold' }}
              />
              <div className="mt-2 flex items-center text-sm">
                <Tag color={Number(summaryData.avgChangeRate) >= 0 ? 'green' : 'red'} icon={Number(summaryData.avgChangeRate) >= 0 ? <RiseOutlined /> : <FallOutlined />}>
                  环比 {Number(summaryData.avgChangeRate) >= 0 ? '+' : ''}{summaryData.avgChangeRate}%
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
                    本期出栏
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
                    猪粮比价
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
            extra={<span className="text-sm text-gray-500">💡 点击省份可下钻查看地市详情</span>}
          >
            <div style={{ height: 480 }}>
              {filteredMetrics.length > 0 ? (
                <ReactECharts 
                  option={heatMapOption} 
                  style={{ height: '100%' }}
                  onEvents={{
                    click: handleMapClick
                  }}
                  notMerge={true}
                  lazyUpdate={false}
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
              pagination={{ pageSize: 8, showSizeChanger: false }}
              size="small"
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card 
            title="全国近7天出栏趋势" 
            className="rounded-xl border-0"
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

      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{drillDownProvince}</span>
            <Tag color="blue">详细数据</Tag>
          </div>
        }
        open={drillDownModalVisible}
        onCancel={() => setDrillDownModalVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setDrillDownModalVisible(false)} size="large">
            返回全国
          </Button>
        ]}
      >
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={14}>
            <Card size="small" className="border-1">
              <div style={{ height: 320 }}>
                <ReactECharts option={drillDownTrendOption} style={{ height: '100%' }} notMerge={true} />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card size="small" className="border-1">
              <div style={{ height: 320 }}>
                <ReactECharts option={drillDownDiseaseOption} style={{ height: '100%' }} notMerge={true} />
              </div>
            </Card>
          </Col>
        </Row>
        
        <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8 }}>
          <p className="text-sm text-green-800 m-0">
            <strong>💡 提示：</strong> 以上数据为该省各地市近7天的统计汇总。可通过顶部筛选器切换不同时间范围查看。
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
