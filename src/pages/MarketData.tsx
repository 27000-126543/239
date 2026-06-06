
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Select, Table, DatePicker, Statistic, Tag, Input, Spin, Button } from 'antd';
import { 
  ShoppingCartOutlined, 
  RiseOutlined, 
  DollarOutlined, 
  OrderedListOutlined,
  SearchOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useStore } from '../store/useStore';
import { getMarketData } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { MarketData as MarketDataType } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const MarketData: React.FC = () => {
  const { loading, setLoading } = useStore();
  const [data, setData] = useState<MarketDataType[]>([]);
  const [filteredData, setFilteredData] = useState<MarketDataType[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [data, selectedProvince, dateRange, searchKeyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMarketData();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('加载批发市场数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...data];
    
    if (selectedProvince !== 'all') {
      filtered = filtered.filter(item => item.province === selectedProvince);
    }
    
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(item => {
        const itemDate = dayjs(item.date);
        return itemDate.isAfter(dateRange[0].subtract(1, 'day')) && 
               itemDate.isBefore(dateRange[1].add(1, 'day'));
      });
    }
    
    if (searchKeyword) {
      filtered = filtered.filter(item => 
        item.marketName.includes(searchKeyword) ||
        item.province.includes(searchKeyword) ||
        item.city.includes(searchKeyword)
      );
    }
    
    setFilteredData(filtered);
  };

  const totalVolume = filteredData.reduce((sum, item) => sum + item.tradeVolume, 0);
  const avgPrice = filteredData.length > 0
    ? (filteredData.reduce((sum, item) => sum + item.avgPrice, 0) / filteredData.length).toFixed(2)
    : 0;
  const avgWholesalePrice = filteredData.length > 0
    ? (filteredData.reduce((sum, item) => sum + item.wholesalePrice, 0) / filteredData.length).toFixed(2)
    : 0;

  const provinces = Array.from(new Set(data.map(item => item.province))).sort();

  const priceTrendOption = {
    title: { text: '批发价格走势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['平均价格', '批发价格'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: filteredData.slice(0, 30).map(item => item.date).reverse(),
      axisLabel: { rotate: 45, fontSize: 10 }
    },
    yAxis: { type: 'value', name: '元/公斤' },
    series: [
      {
        name: '平均价格',
        type: 'line',
        smooth: true,
        data: filteredData.slice(0, 30).map(item => item.avgPrice).reverse(),
        itemStyle: { color: '#52c41a' },
        areaStyle: { color: 'rgba(82, 196, 26, 0.2)' }
      },
      {
        name: '批发价格',
        type: 'line',
        smooth: true,
        data: filteredData.slice(0, 30).map(item => item.wholesalePrice).reverse(),
        itemStyle: { color: '#fa8c16' }
      }
    ]
  };

  const volumeDistributionOption = {
    title: { text: '各省份交易量分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: Array.from(new Set(filteredData.map(item => item.province))).slice(0, 10),
      axisLabel: { rotate: 45, fontSize: 10 }
    },
    yAxis: { type: 'value', name: '吨' },
    series: [{
      name: '交易量',
      type: 'bar',
      data: Array.from(new Set(filteredData.map(item => item.province))).slice(0, 10).map(prov => 
        filteredData.filter(item => item.province === prov).reduce((sum, item) => sum + item.tradeVolume, 0)
      ),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#1890ff' },
            { offset: 1, color: '#91d5ff' }
          ]
        }
      }
    }]
  };

  const columns: ColumnsType<MarketDataType> = [
    {
      title: '批发市场名称',
      dataIndex: 'marketName',
      key: 'marketName',
      width: 180,
      ellipsis: true
    },
    {
      title: '省份',
      dataIndex: 'province',
      key: 'province',
      width: 100,
      filters: provinces.map(p => ({ text: p, value: p })),
      onFilter: (value, record) => record.province === value
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 100
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    },
    {
      title: '交易量(吨)',
      dataIndex: 'tradeVolume',
      key: 'tradeVolume',
      width: 100,
      sorter: (a, b) => a.tradeVolume - b.tradeVolume,
      render: (val) => <Tag color="blue">{val.toLocaleString()}</Tag>
    },
    {
      title: '平均价格(元/kg)',
      dataIndex: 'avgPrice',
      key: 'avgPrice',
      width: 130,
      sorter: (a, b) => a.avgPrice - b.avgPrice,
      render: (val) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{val}</span>
    },
    {
      title: '批发价格(元/kg)',
      dataIndex: 'wholesalePrice',
      key: 'wholesalePrice',
      width: 130,
      sorter: (a, b) => a.wholesalePrice - b.wholesalePrice,
      render: (val) => <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{val}</span>
    },
    {
      title: '环比涨跌幅(%)',
      dataIndex: 'priceChangeRate',
      key: 'priceChangeRate',
      width: 120,
      render: (val) => (
        <Tag color={val >= 0 ? 'red' : 'green'}>
          {val >= 0 ? '+' : ''}{val}%
        </Tag>
      )
    }
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ padding: '0 16px 16px' }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="累计交易量"
                value={totalVolume}
                suffix="吨"
                prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均价格"
                value={Number(avgPrice)}
                suffix="元/kg"
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均批发价"
                value={Number(avgWholesalePrice)}
                suffix="元/kg"
                prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="数据记录数"
                value={filteredData.length}
                suffix="条"
                prefix={<UnorderedListOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Card style={{ marginTop: 16, marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="选择省份"
                value={selectedProvince}
                onChange={setSelectedProvince}
                allowClear
              >
                <Option value="all">全部省份</Option>
                {provinces.map(prov => (
                  <Option key={prov} value={prov}>{prov}</Option>
                ))}
              </Select>
            </Col>
            <Col span={8}>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
            </Col>
            <Col span={6}>
              <Input
                placeholder="搜索市场/地区"
                prefix={<SearchOutlined />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Button type="primary" onClick={loadData} block>
                刷新数据
              </Button>
            </Col>
          </Row>
        </Card>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card>
              <ReactECharts option={priceTrendOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <ReactECharts option={volumeDistributionOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>

        <Card title="批发市场数据明细">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            scroll={{ x: 1100 }}
          />
        </Card>
      </div>
    </Spin>
  );
};

export default MarketData;
