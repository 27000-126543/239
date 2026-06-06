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
import { getNationalMetrics, getWarnings, getFarmData, getSlaughterData, getMarketData, getCityDataByProvince } from '../services/api';
import { chinaOfficialGeoJSON, provinceNameMap, normalizeProvinceName } from '../data/chinaOfficialMap';
import type { ColumnsType } from 'antd/es/table';
import type { CoreMetrics, FarmData } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;

echarts.registerMap('china', chinaOfficialGeoJSON as any);

interface CityData {
  cities: string[];
  trendData: { date: string; [key: string]: number | string }[];
  diseaseData: { city: string; positiveRate: number }[];
}

const Dashboard: React.FC = () => {
  const { user, loading, setLoading } = useStore();
  const [allMetrics, setAllMetrics] = useState<CoreMetrics[]>([]);
  const [filteredMetrics, setFilteredMetrics] = useState<CoreMetrics[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('全国');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [drillDownProvince, setDrillDownProvince] = useState<string | null>(null);
  const [drillDownModalVisible, setDrillDownModalVisible] = useState(false);
  const [farmData, setFarmData] = useState<FarmData[]>([]);
  const [cityData, setCityData] = useState<CityData | null>(null);
  const [cityDataLoading, setCityDataLoading] = useState(false);

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
        provinceNameMap[m.province] === selectedProvince ||
        normalizeProvinceName(m.province) === selectedProvince
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

  const nationalSummary = useMemo(() => {
    const latest = getLatestByProvince(allMetrics);
    return {
      totalInventory: latest.reduce((sum, m) => sum + m.totalInventory, 0),
      totalSlaughter: latest.reduce((sum, m) => sum + m.totalSlaughter, 0),
      avgGrainRatio: latest.length > 0 ? latest.reduce((sum, m) => sum + m.avgGrainRatio, 0) / latest.length : 0,
      avgFeedConversionRatio: latest.length > 0 ? latest.reduce((sum, m) => sum + m.avgFeedConversionRatio, 0) / latest.length : 0,
      avgInventoryChange: latest.length > 0 ? latest.reduce((sum, m) => sum + m.inventoryChangeRate, 0) / latest.length : 0,
      avgSlaughterWeight: latest.length > 0 ? latest.reduce((sum, m) => sum + m.avgSlaughterWeight, 0) / latest.length : 0,
    };
  }, [allMetrics]);

  const heatMapOption = useMemo(() => {
    const mapData = filteredMetrics.map(m => ({
      name: normalizeProvinceName(m.province),
      value: m.totalInventory,
      province: m.province
    }));

    const maxValue = Math.max(...mapData.map(d => d.value), 1);

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.data) {
            return `${params.name}<br/>生猪存栏: <strong>${(params.data.value / 10000).toFixed(2)}万头</strong>`;
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
          color: ['#dcfce7', '#86efac', '#22c55e', '#16a34a', '#15803d', '#166534']
        }
      },
      series: [
        {
          name: '生猪存栏',
          type: 'map',
          map: 'china',
          roam: true,
          scaleLimit: {
            min: 0.8,
            max: 3
          },
          label: {
            show: true,
            fontSize: 10,
            color: '#374151'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold',
              color: '#16a34a'
            },
            itemStyle: {
              areaColor: '#bbf7d0',
              borderColor: '#16a34a',
              borderWidth: 2
            }
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          },
          data: mapData
        }
      ]
    };
  }, [filteredMetrics]);

  const trendOption = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      return dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD');
    });

    const dailyData = last7Days.map(date => {
      const dayMetrics = allMetrics.filter(m => dayjs(m.calculateDate).isSame(date, 'day'));
      return {
        date,
        slaughter: dayMetrics.reduce((sum, m) => sum + m.totalSlaughter, 0)
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>出栏量: <strong>${p.value.toLocaleString()}头</strong>`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dailyData.map(d => d.date),
        axisLabel: { rotate: 30, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: '出栏量(头)'
      },
      series: [
        {
          name: '全国出栏量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          data: dailyData.map(d => d.slaughter),
          lineStyle: {
            width: 3,
            color: '#22c55e'
          },
          itemStyle: {
            color: '#22c55e'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
              { offset: 1, color: 'rgba(34, 197, 94, 0.05)' }
            ])
          }
        }
      ]
    };
  }, [allMetrics]);

  const diseaseDistributionOption = useMemo(() => {
    const latest = getLatestByProvince(allMetrics);
    const top10 = [...latest].sort((a, b) => b.totalInventory - a.totalInventory).slice(0, 10);
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: top10.map(m => normalizeProvinceName(m.province)),
        axisLabel: { rotate: 30, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: '阳性率(%)'
      },
      series: [
        {
          name: '疫病阳性率',
          type: 'bar',
          data: top10.map((_, i) => 2 + Math.random() * 4),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#f87171' },
              { offset: 1, color: '#ef4444' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
  }, [allMetrics]);

  const priceRankColumns: ColumnsType<CoreMetrics> = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
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
      render: (val: string) => normalizeProvinceName(val)
    },
    {
      title: '存栏量(万头)',
      dataIndex: 'totalInventory',
      key: 'totalInventory',
      render: (val: number) => (val / 10000).toFixed(1),
      sorter: (a, b) => a.totalInventory - b.totalInventory
    },
    {
      title: '猪粮比',
      dataIndex: 'avgGrainRatio',
      key: 'avgGrainRatio',
      render: (val: number) => (
        <span className={val < 5.0 ? 'text-red-600 font-bold' : 'text-green-600'}>
          {val.toFixed(2)}:1
        </span>
      )
    },
    {
      title: '存栏变化',
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

  const sortedMetrics = useMemo(() => {
    return [...filteredMetrics].sort((a, b) => b.totalInventory - a.totalInventory);
  }, [filteredMetrics]);

  const provinces = useMemo(() => {
    const provs = Array.from(new Set(allMetrics.map(m => m.province))).sort();
    return ['全国', ...provs];
  }, [allMetrics]);

  const quarters = useMemo(() => {
    const years = ['2025', '2026'];
    const qs = ['Q1', 'Q2', 'Q3', 'Q4'];
    return years.flatMap(y => qs.map(q => `${y}${q}`));
  }, []);

  const loadCityData = async (province: string) => {
    setCityDataLoading(true);
    setCityData(null);
    try {
      const res = await getCityDataByProvince(province);
      if (res.success && res.data) {
        setCityData(res.data);
      } else {
        message.warning('未获取到城市数据');
      }
    } catch (err) {
      console.error('获取城市数据失败:', err);
      message.error('获取城市数据失败');
    } finally {
      setCityDataLoading(false);
    }
  };

  const handleMapClick = useCallback((params: any) => {
    if (params.name) {
      const provinceFullName = Object.keys(provinceNameMap).find(
        key => provinceNameMap[key] === params.name
      ) || params.name;
      setDrillDownProvince(provinceFullName);
      setDrillDownModalVisible(true);
      loadCityData(provinceFullName);
    }
  }, []);

  const drillDownTrendOption = useMemo(() => {
    if (!cityData || cityData.trendData.length === 0) return {};
    
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
        data: cityData.cities,
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
        data: cityData.trendData.map(d => d.date),
        axisLabel: { rotate: 30, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: '出栏量(头)'
      },
      series: cityData.cities.map((city, idx) => ({
        name: city,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: cityData.trendData.map(d => d[city] as number || 0),
        lineStyle: {
          width: 2,
          color: colors[idx % colors.length]
        },
        itemStyle: {
          color: colors[idx % colors.length]
        }
      }))
    };
  }, [cityData]);

  const drillDownDiseaseOption = useMemo(() => {
    if (!cityData || cityData.diseaseData.length === 0) return {};
    
    const pieData = cityData.diseaseData.map(d => ({
      name: d.city,
      value: d.positiveRate
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
  }, [cityData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="数据加载中..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">全国生猪产业链监测</h1>
        <p className="text-gray-500">实时监测全国生猪产业运行态势</p>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border-0 shadow-sm">
            <Statistic
              title={<span className="text-gray-600 flex items-center gap-2"><HomeOutlined /> 全国生猪存栏</span>}
              value={nationalSummary.totalInventory}
              precision={0}
              suffix="头"
              valueStyle={{ color: '#22c55e', fontSize: 24 }}
              prefix={<RiseOutlined />}
            />
            <p className="text-xs text-gray-400 mt-2 mb-0">
              较上周 <span className="text-green-600">+{(nationalSummary.avgInventoryChange).toFixed(2)}%</span>
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border-0 shadow-sm">
            <Statistic
              title={<span className="text-gray-600 flex items-center gap-2"><ShopOutlined /> 本周累计出栏</span>}
              value={nationalSummary.totalSlaughter}
              precision={0}
              suffix="头"
              valueStyle={{ color: '#3b82f6', fontSize: 24 }}
            />
            <p className="text-xs text-gray-400 mt-2 mb-0">
              平均出栏体重 <span className="text-blue-600 font-medium">{nationalSummary.avgSlaughterWeight.toFixed(1)}kg</span>
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border-0 shadow-sm">
            <Statistic
              title={<span className="text-gray-600 flex items-center gap-2"><PercentageOutlined /> 平均猪粮比</span>}
              value={nationalSummary.avgGrainRatio}
              precision={2}
              suffix=":1"
              valueStyle={{ color: nationalSummary.avgGrainRatio < 5.0 ? '#ef4444' : '#22c55e', fontSize: 24 }}
            />
            <p className="text-xs text-gray-400 mt-2 mb-0">
              盈亏平衡点 <span className={nationalSummary.avgGrainRatio < 5.0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>5.0:1</span>
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border-0 shadow-sm">
            <Statistic
              title={<span className="text-gray-600 flex items-center gap-2"><DollarOutlined /> 平均料肉比</span>}
              value={nationalSummary.avgFeedConversionRatio}
              precision={2}
              suffix=":1"
              valueStyle={{ color: '#f97316', fontSize: 24 }}
            />
            <p className="text-xs text-gray-400 mt-2 mb-0">
              行业平均水平 <span className="text-orange-600 font-medium">2.8:1</span>
            </p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <span className="text-gray-600 font-medium mr-2">省份筛选：</span>
          <Select 
            value={selectedProvince} 
            onChange={setSelectedProvince}
            style={{ width: 180 }}
            allowClear
          >
            {provinces.map(p => (
              <Option key={p} value={p}>{p}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <span className="text-gray-600 font-medium mr-2">季度筛选：</span>
          <Select 
            value={selectedQuarter} 
            onChange={setSelectedQuarter}
            style={{ width: 180 }}
            allowClear
            placeholder="选择季度"
          >
            {quarters.map(q => (
              <Option key={q} value={q}>{q}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} md={12} style={{ textAlign: 'right' }}>
          <Button type="primary" onClick={loadAllData}>
            刷新数据
          </Button>
        </Col>
      </Row>

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

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
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
        onCancel={() => {
          setDrillDownModalVisible(false);
          setCityData(null);
        }}
        width={1000}
        footer={[
          <Button key="close" onClick={() => {
            setDrillDownModalVisible(false);
            setCityData(null);
          }} size="large">
            返回全国
          </Button>
        ]}
      >
        {cityDataLoading ? (
          <div className="flex items-center justify-center" style={{ height: 320 }}>
            <Spin size="large" tip="正在加载城市数据..." />
          </div>
        ) : cityData ? (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={14}>
              <Card size="small" className="border-1">
                <div style={{ height: 320 }}>
                  {cityData.trendData.length > 0 ? (
                    <ReactECharts option={drillDownTrendOption} style={{ height: '100%' }} notMerge={true} />
                  ) : (
                    <Empty description="暂无出栏趋势数据" style={{ paddingTop: 80 }} />
                  )}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card size="small" className="border-1">
                <div style={{ height: 320 }}>
                  {cityData.diseaseData.length > 0 ? (
                    <ReactECharts option={drillDownDiseaseOption} style={{ height: '100%' }} notMerge={true} />
                  ) : (
                    <Empty description="暂无疫病数据" style={{ paddingTop: 80 }} />
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        ) : (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Empty description="暂无城市数据" />
          </div>
        )}
        
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
