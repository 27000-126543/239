import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Select, Table, DatePicker, Statistic, Tag, Input, Spin, Button } from 'antd';
import { 
  ShopOutlined, 
  RiseOutlined, 
  DollarOutlined, 
  NumberOutlined,
  SearchOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useStore } from '../store/useStore';
import { getSlaughterData } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { SlaughterData as SlaughterDataType } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const SlaughterData: React.FC = () => {
  const { loading, setLoading } = useStore();
  const [data, setData] = useState<SlaughterDataType[]>([]);
  const [filteredData, setFilteredData] = useState<SlaughterDataType[]>([]);
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
      const res = await getSlaughterData();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('加载屠宰场数据失败:', err);
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
        item.slaughterhouseName.includes(searchKeyword) ||
        item.province.includes(searchKeyword) ||
        item.city.includes(searchKeyword)
      );
    }
    
    setFilteredData(filtered);
  };

  const totalSlaughter = filteredData.reduce((sum, item) => sum + item.slaughterCount, 0);
  const avgCarcassWeight = filteredData.length > 0 
    ? (filteredData.reduce((sum, item) => sum + item.carcassWeight, 0) / filteredData.length).toFixed(1)
    : 0;
  const avgPrice = filteredData.length > 0
    ? (filteredData.reduce((sum, item) => sum + item.carcassPrice, 0) / filteredData.length).toFixed(2)
    : 0;

  const provinces = Array.from(new Set(data.map(item => item.province))).sort();

  const priceTrendOption = {
    title: { text: '白条价格走势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['白条价格'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: filteredData.slice(0, 30).map(item => item.date).reverse(),
      axisLabel: { rotate: 45, fontSize: 10 }
    },
    yAxis: { type: 'value', name: '元/公斤' },
    series: [{
      name: '白条价格',
      type: 'line',
      smooth: true,
      data: filteredData.slice(0, 30).map(item => item.carcassPrice).reverse(),
      itemStyle: { color: '#52c41a' },
      areaStyle: { color: 'rgba(82, 196, 26, 0.2)' }
    }]
  };

  const slaughterDistributionOption = {
    title: { text: '各省份屠宰量分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: Array.from(new Set(filteredData.map(item => item.province))).slice(0, 10),
      axisLabel: { rotate: 45, fontSize: 10 }
    },
    yAxis: { type: 'value', name: '头' },
    series: [{
      name: '屠宰量',
      type: 'bar',
      data: Array.from(new Set(filteredData.map(item => item.province))).slice(0, 10).map(prov => 
        filteredData.filter(item => item.province === prov).reduce((sum, item) => sum + item.slaughterCount, 0)
      ),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#52c41a' },
            { offset: 1, color: '#95de64' }
          ]
        }
      }
    }]
  };

  const columns: ColumnsType<SlaughterDataType> = [
    {
      title: '屠宰场名称',
      dataIndex: 'slaughterhouseName',
      key: 'slaughterhouseName',
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
      title: '屠宰量(头)',
      dataIndex: 'slaughterCount',
      key: 'slaughterCount',
      width: 100,
      sorter: (a, b) => a.slaughterCount - b.slaughterCount,
      render: (val) => <Tag color="green">{val.toLocaleString()}</Tag>
    },
    {
      title: '平均胴体重(kg)',
      dataIndex: 'carcassWeight',
      key: 'carcassWeight',
      width: 120,
      sorter: (a, b) => a.carcassWeight - b.carcassWeight
    },
    {
      title: '白条价格(元/kg)',
      dataIndex: 'carcassPrice',
      key: 'carcassPrice',
      width: 120,
      sorter: (a, b) => a.carcassPrice - b.carcassPrice,
      render: (val) => <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{val}</span>
    },
    {
      title: '检疫合格率(%)',
      dataIndex: 'inspectionPassRate',
      key: 'inspectionPassRate',
      width: 110,
      render: (val) => (
        <Tag color={val >= 98 ? 'success' : val >= 95 ? 'warning' : 'error'}>
          {val}%
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
                title="累计屠宰量"
                value={totalSlaughter}
                suffix="头"
                prefix={<ShopOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均胴体重"
                value={Number(avgCarcassWeight)}
                suffix="kg"
                prefix={<NumberOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均白条价格"
                value={Number(avgPrice)}
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
                prefix={<RiseOutlined style={{ color: '#722ed1' }} />}
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
                placeholder="搜索屠宰场/地区"
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
              <ReactECharts option={slaughterDistributionOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>

        <Card title="屠宰场数据明细">
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
            scroll={{ x: 1000 }}
          />
        </Card>
      </div>
    </Spin>
  );
};

export default SlaughterData;
