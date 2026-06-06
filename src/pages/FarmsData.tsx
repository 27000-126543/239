
import React, { useEffect, useState } from 'react';
import { Card, Table, Select, DatePicker, Input, Button, Tag, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { getFarmData } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { FarmData } from '../types';

const { Option } = Select;
const { RangePicker } = DatePicker;

const FarmsData: React.FC = () => {
  const { farmData, setFarmData, user } = useStore();
  const [loading, setLoading] = useState(false);
  const [province, setProvince] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getFarmData({ province });
      if (res.success && res.data) {
        setFarmData(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredData = farmData.filter(item => 
    !keyword || 
    item.farmName?.includes(keyword) ||
    item.breed?.includes(keyword)
  );

  const getScaleText = (scale: string) => {
    const map: Record<string, string> = {
      'small': '小规模',
      'medium': '中规模',
      'large': '大规模'
    };
    return map[scale] || scale;
  };

  const columns: ColumnsType<FarmData> = [
    {
      title: '养殖场名称',
      dataIndex: 'farmName',
      key: 'farmName',
      width: 200,
    },
    {
      title: '所在地区',
      key: 'region',
      width: 150,
      render: (_, record) => `${record.province} ${record.city}`
    },
    {
      title: '养殖规模',
      dataIndex: 'scale',
      key: 'scale',
      width: 100,
      render: (scale: string) => (
        <Tag color={scale === 'large' ? 'green' : scale === 'medium' ? 'blue' : 'orange'}>
          {getScaleText(scale)}
        </Tag>
      )
    },
    {
      title: '品种',
      dataIndex: 'breed',
      key: 'breed',
      width: 120,
    },
    {
      title: '存栏量（头）',
      dataIndex: 'inventory',
      key: 'inventory',
      width: 120,
      sorter: (a, b) => a.inventory - b.inventory,
      render: (val: number) => val.toLocaleString()
    },
    {
      title: '出栏量（头）',
      dataIndex: 'slaughter',
      key: 'slaughter',
      width: 120,
      sorter: (a, b) => a.slaughter - b.slaughter,
      render: (val: number) => val.toLocaleString()
    },
    {
      title: '饲料消耗（吨）',
      dataIndex: 'feedConsumption',
      key: 'feedConsumption',
      width: 130,
      render: (val: number) => val.toFixed(1)
    },
    {
      title: '疫病阳性率',
      dataIndex: 'diseasePositiveRate',
      key: 'diseasePositiveRate',
      width: 120,
      render: (val: number) => (
        <span className={val > 2 ? 'text-red-600' : 'text-green-600'}>
          {val}%
        </span>
      )
    },
    {
      title: '平均体重（kg）',
      dataIndex: 'averageWeight',
      key: 'averageWeight',
      width: 130,
      render: (val: number) => val.toFixed(1)
    },
    {
      title: '上报日期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0">养殖场数据中心</h1>
          <p className="text-gray-500 mt-1 m-0">查看和管理全国养殖场生产数据</p>
        </div>
      </div>

      <Card className="rounded-xl border-0">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <Select
            placeholder="选择省份"
            style={{ width: 150 }}
            allowClear
            value={province}
            onChange={setProvince}
          >
            <Option value="河南省">河南省</Option>
            <Option value="山东省">山东省</Option>
            <Option value="四川省">四川省</Option>
            <Option value="湖南省">湖南省</Option>
            <Option value="广东省">广东省</Option>
          </Select>
          
          <RangePicker placeholder={['开始日期', '结束日期']} />
          
          <Input
            placeholder="搜索养殖场名称/品种"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
          
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
            <Button type="primary">导出数据</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default FarmsData;
