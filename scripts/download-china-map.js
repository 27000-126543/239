import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';
const outputPath = path.join(__dirname, '../src/data/chinaMapData.json');

console.log('正在下载官方中国地图数据...');

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      fs.writeFileSync(outputPath, JSON.stringify(json, null, 2), 'utf-8');
      console.log(`✅ 地图数据已保存到: ${outputPath}`);
      console.log(`📊 包含 ${json.features.length} 个省级行政区`);
    } catch (e) {
      console.error('❌ 解析JSON失败:', e.message);
      process.exit(1);
    }
  });
}).on('error', (e) => {
  console.error('❌ 下载失败:', e.message);
  process.exit(1);
});
