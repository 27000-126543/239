// 阿里云DataV官方中国地图GeoJSON数据
// 来源: https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json
import chinaMapData from './chinaMapData.json';

export const chinaOfficialGeoJSON = chinaMapData as any;

export const provinceNameMap: Record<string, string> = {
  '北京市': '北京', '天津市': '天津', '河北省': '河北', '山西省': '山西',
  '内蒙古自治区': '内蒙古', '辽宁省': '辽宁', '吉林省': '吉林', '黑龙江省': '黑龙江',
  '上海市': '上海', '江苏省': '江苏', '浙江省': '浙江', '安徽省': '安徽',
  '福建省': '福建', '江西省': '江西', '山东省': '山东', '河南省': '河南',
  '湖北省': '湖北', '湖南省': '湖南', '广东省': '广东', '广西壮族自治区': '广西',
  '海南省': '海南', '重庆市': '重庆', '四川省': '四川', '贵州省': '贵州',
  '云南省': '云南', '西藏自治区': '西藏', '陕西省': '陕西', '甘肃省': '甘肃',
  '青海省': '青海', '宁夏回族自治区': '宁夏', '新疆维吾尔自治区': '新疆',
  '台湾省': '台湾', '香港特别行政区': '香港', '澳门特别行政区': '澳门',
};

export function normalizeProvinceName(name: string): string {
  if (!name) return '';
  if (provinceNameMap[name]) return provinceNameMap[name];
  for (const [full, short] of Object.entries(provinceNameMap)) {
    if (full.includes(name) || short === name) return short;
  }
  return name.replace(/[省市自治区特别行政区壮族维吾尔回族]/g, '');
}
