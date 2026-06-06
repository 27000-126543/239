
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'pig-monitor.db');

export async function initDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('national', 'provincial', 'municipal', 'enterprise')),
      province TEXT,
      city TEXT,
      permissions TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      scale TEXT NOT NULL CHECK (scale IN ('small', 'medium', 'large')),
      breed TEXT NOT NULL,
      manager_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farm_data (
      id TEXT PRIMARY KEY,
      farm_id TEXT REFERENCES farms(id),
      inventory INTEGER NOT NULL,
      slaughter INTEGER NOT NULL,
      feed_consumption REAL NOT NULL,
      disease_positive_rate REAL NOT NULL,
      average_weight REAL NOT NULL,
      report_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS slaughterhouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      manager_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS slaughter_data (
      id TEXT PRIMARY KEY,
      slaughterhouse_id TEXT REFERENCES slaughterhouses(id),
      slaughter_volume INTEGER NOT NULL,
      carcass_price REAL NOT NULL,
      report_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS markets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS market_data (
      id TEXT PRIMARY KEY,
      market_id TEXT REFERENCES markets(id),
      trade_volume INTEGER NOT NULL,
      average_price REAL NOT NULL,
      report_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS core_metrics (
      id TEXT PRIMARY KEY,
      province TEXT NOT NULL,
      city TEXT,
      total_inventory INTEGER NOT NULL,
      total_slaughter INTEGER NOT NULL,
      avg_feed_conversion_ratio REAL NOT NULL,
      avg_grain_ratio REAL NOT NULL,
      inventory_change_rate REAL NOT NULL,
      avg_slaughter_weight REAL NOT NULL,
      calculate_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('grain_ratio', 'slaughter_drop')),
      level TEXT NOT NULL CHECK (level IN ('primary', 'secondary')),
      province TEXT NOT NULL,
      description TEXT NOT NULL,
      triggered_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'reviewed', 'approved', 'resolved')),
      current_step INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS approval_steps (
      id TEXT PRIMARY KEY,
      warning_id TEXT REFERENCES warnings(id),
      step INTEGER NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      comment TEXT,
      operator_id TEXT REFERENCES users(id),
      operated_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forecasts (
      id TEXT PRIMARY KEY,
      province TEXT,
      forecast_months TEXT NOT NULL,
      supply_forecast TEXT NOT NULL,
      supply_gap TEXT NOT NULL,
      feed_cost_forecast TEXT NOT NULL,
      recommended_strategy TEXT NOT NULL,
      confidence REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weekly_reports (
      id TEXT PRIMARY KEY,
      week TEXT NOT NULL,
      province TEXT,
      inventory_yoy REAL NOT NULL,
      disease_rate REAL NOT NULL,
      cost_profit_analysis TEXT NOT NULL,
      recommendations TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feed_prices (
      id TEXT PRIMARY KEY,
      province TEXT NOT NULL,
      corn_price REAL NOT NULL,
      soybean_meal_price REAL NOT NULL,
      report_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    await seedMockData(db);
  }

  return db;
}

async function seedMockData(db: any) {
  const provinces = [
    { name: '北京市', cities: ['北京市'] },
    { name: '天津市', cities: ['天津市'] },
    { name: '河北省', cities: ['石家庄市', '唐山市', '保定市'] },
    { name: '山西省', cities: ['太原市', '大同市', '运城市'] },
    { name: '内蒙古自治区', cities: ['呼和浩特市', '包头市', '赤峰市'] },
    { name: '辽宁省', cities: ['沈阳市', '大连市', '锦州市'] },
    { name: '吉林省', cities: ['长春市', '吉林市', '四平市'] },
    { name: '黑龙江省', cities: ['哈尔滨市', '齐齐哈尔市', '绥化市'] },
    { name: '上海市', cities: ['上海市'] },
    { name: '江苏省', cities: ['南京市', '苏州市', '徐州市'] },
    { name: '浙江省', cities: ['杭州市', '宁波市', '金华市'] },
    { name: '安徽省', cities: ['合肥市', '阜阳市', '宿州市'] },
    { name: '福建省', cities: ['福州市', '厦门市', '漳州市'] },
    { name: '江西省', cities: ['南昌市', '赣州市', '宜春市'] },
    { name: '山东省', cities: ['济南市', '青岛市', '潍坊市'] },
    { name: '河南省', cities: ['郑州市', '周口市', '商丘市'] },
    { name: '湖北省', cities: ['武汉市', '襄阳市', '荆州市'] },
    { name: '湖南省', cities: ['长沙市', '衡阳市', '株洲市'] },
    { name: '广东省', cities: ['广州市', '深圳市', '湛江市'] },
    { name: '广西壮族自治区', cities: ['南宁市', '玉林市', '桂林市'] },
    { name: '海南省', cities: ['海口市', '三亚市'] },
    { name: '重庆市', cities: ['重庆市'] },
    { name: '四川省', cities: ['成都市', '绵阳市', '德阳市'] },
    { name: '贵州省', cities: ['贵阳市', '遵义市', '毕节市'] },
    { name: '云南省', cities: ['昆明市', '曲靖市', '玉溪市'] },
    { name: '西藏自治区', cities: ['拉萨市'] },
    { name: '陕西省', cities: ['西安市', '咸阳市', '渭南市'] },
    { name: '甘肃省', cities: ['兰州市', '天水市', '平凉市'] },
    { name: '青海省', cities: ['西宁市'] },
    { name: '宁夏回族自治区', cities: ['银川市', '吴忠市'] },
    { name: '新疆维吾尔自治区', cities: ['乌鲁木齐市', '昌吉州', '伊犁州'] }
  ];

  const breeds = ['长白猪', '大白猪', '杜洛克', '土猪', '黑猪', '三元杂交猪'];
  const scales: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];

  await db.run('INSERT INTO users (id, username, password, name, role, province, city, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['u001', 'admin', 'admin123', '国家级管理员', 'national', null, null, JSON.stringify(['all'])]
  );

  await db.run('INSERT INTO users (id, username, password, name, role, province, city, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['u002', 'province_henan', '123456', '河南省畜牧局', 'provincial', '河南省', null, JSON.stringify(['province:view', 'province:approve'])]
  );

  await db.run('INSERT INTO users (id, username, password, name, role, province, city, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['u003', 'province_shandong', '123456', '山东省畜牧局', 'provincial', '山东省', null, JSON.stringify(['province:view', 'province:approve'])]
  );

  await db.run('INSERT INTO users (id, username, password, name, role, province, city, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['u004', 'city_zhengzhou', '123456', '郑州市农业局', 'municipal', '河南省', '郑州市', JSON.stringify(['city:view'])]
  );

  await db.run('INSERT INTO users (id, username, password, name, role, province, city, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['u005', 'farm_001', '123456', '河南鸿运养殖场', 'enterprise', '河南省', '郑州市', JSON.stringify(['farm:view', 'farm:report'])]
  );

  let farmId = 1;
  for (const prov of provinces) {
    for (const city of prov.cities) {
      const farmCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < farmCount; i++) {
        const scale = scales[Math.floor(Math.random() * scales.length)];
        const breed = breeds[Math.floor(Math.random() * breeds.length)];
        const baseInventory = scale === 'large' ? 5000 + Math.floor(Math.random() * 5000) :
                            scale === 'medium' ? 1000 + Math.floor(Math.random() * 4000) :
                            100 + Math.floor(Math.random() * 900);
        
        await db.run('INSERT INTO farms (id, name, province, city, scale, breed) VALUES (?, ?, ?, ?, ?, ?)',
          [`f${String(farmId).padStart(4, '0')}`, `${city}兴旺养殖${i + 1}场`, prov.name, city, scale, breed]
        );

        for (let d = 0; d < 30; d++) {
          const date = new Date();
          date.setDate(date.getDate() - d);
          const dateStr = date.toISOString().split('T')[0];
          
          const inventoryVariation = Math.floor(baseInventory * (0.95 + Math.random() * 0.1));
          const slaughter = Math.floor(inventoryVariation * (0.02 + Math.random() * 0.03));
          const feedConsumption = Math.round(inventoryVariation * 2.5 * (0.9 + Math.random() * 0.2) * 10) / 10;
          const diseaseRate = Math.round((0.5 + Math.random() * 3) * 100) / 100;
          const avgWeight = Math.round((100 + Math.random() * 30) * 10) / 10;

          await db.run('INSERT INTO farm_data (id, farm_id, inventory, slaughter, feed_consumption, disease_positive_rate, average_weight, report_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [`fd${farmId}${d}`, `f${String(farmId).padStart(4, '0')}`, inventoryVariation, slaughter, feedConsumption, diseaseRate, avgWeight, dateStr]
          );
        }
        farmId++;
      }
    }
  }

  let shId = 1;
  for (const prov of provinces) {
    for (const city of prov.cities.slice(0, 2)) {
      await db.run('INSERT INTO slaughterhouses (id, name, province, city) VALUES (?, ?, ?, ?)',
        [`sh${String(shId).padStart(4, '0')}`, `${city}食品屠宰场`, prov.name, city]
      );

      for (let d = 0; d < 30; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0];
        
        const volume = 200 + Math.floor(Math.random() * 800);
        const price = Math.round((15 + Math.random() * 10) * 100) / 100;

        await db.run('INSERT INTO slaughter_data (id, slaughterhouse_id, slaughter_volume, carcass_price, report_date) VALUES (?, ?, ?, ?, ?)',
          [`sd${shId}${d}`, `sh${String(shId).padStart(4, '0')}`, volume, price, dateStr]
        );
      }
      shId++;
    }
  }

  let marketId = 1;
  for (const prov of provinces) {
    for (const city of prov.cities.slice(0, 1)) {
      await db.run('INSERT INTO markets (id, name, province, city) VALUES (?, ?, ?, ?)',
        [`m${String(marketId).padStart(4, '0')}`, `${city}农产品批发市场`, prov.name, city]
      );

      for (let d = 0; d < 30; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0];
        
        const volume = 5000 + Math.floor(Math.random() * 15000);
        const price = Math.round((18 + Math.random() * 8) * 100) / 100;

        await db.run('INSERT INTO market_data (id, market_id, trade_volume, average_price, report_date) VALUES (?, ?, ?, ?, ?)',
          [`md${marketId}${d}`, `m${String(marketId).padStart(4, '0')}`, volume, price, dateStr]
        );
      }
      marketId++;
    }
  }

  for (const prov of provinces) {
    for (let d = 0; d < 30; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      
      let totalInventory = 0;
      let totalSlaughter = 0;
      let totalFeed = 0;
      let totalWeight = 0;
      let count = 0;

      const farmDatas = await db.all(
        `SELECT fd.* FROM farm_data fd 
         JOIN farms f ON fd.farm_id = f.id 
         WHERE f.province = ? AND fd.report_date = ?`,
        [prov.name, dateStr]
      );

      for (const fd of farmDatas) {
        totalInventory += fd.inventory;
        totalSlaughter += fd.slaughter;
        totalFeed += fd.feed_consumption;
        totalWeight += fd.average_weight;
        count++;
      }

      if (count > 0) {
        const cornPrice = 2.5 + Math.random() * 0.5;
        const soybeanMealPrice = 3.5 + Math.random() * 1;
        const avgFCR = count > 0 ? Math.round((totalFeed / (totalSlaughter * 110 || 1)) * 100) / 100 : 2.8;
        const avgGrainRatio = Math.round((20 / (cornPrice * 2)) * 100) / 100;
        const changeRate = Math.round((Math.random() * 6 - 3) * 100) / 100;
        const avgWeight = count > 0 ? Math.round((totalWeight / count) * 10) / 10 : 115;

        await db.run('INSERT INTO core_metrics (id, province, total_inventory, total_slaughter, avg_feed_conversion_ratio, avg_grain_ratio, inventory_change_rate, avg_slaughter_weight, calculate_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [`cm${prov.name}${d}`, prov.name, totalInventory, totalSlaughter, avgFCR, avgGrainRatio, changeRate, avgWeight, dateStr]
        );

        if (d === 0) {
          await db.run('INSERT INTO feed_prices (id, province, corn_price, soybean_meal_price, report_date) VALUES (?, ?, ?, ?, ?)',
            [`fp${prov.name}`, prov.name, cornPrice, soybeanMealPrice, dateStr]
          );
        }
      }
    }
  }

  await db.run('INSERT INTO warnings (id, type, level, province, description, triggered_at, status, current_step) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['w001', 'grain_ratio', 'primary', '河南省', '河南省猪粮比已连续5天低于5:1，当前猪粮比为4.8:1', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 'confirmed', 1]
  );

  await db.run('INSERT INTO warnings (id, type, level, province, description, triggered_at, status, current_step) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['w002', 'slaughter_drop', 'primary', '山东省', '山东省本周出栏量同比下降23.5%，市场供应存在缺口风险', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 'pending', 0]
  );

  await db.run('INSERT INTO warnings (id, type, level, province, description, triggered_at, status, current_step) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['w003', 'grain_ratio', 'secondary', '黑龙江省', '黑龙江省猪粮比持续走低，当前为5.5:1，需密切关注', new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 'pending', 0]
  );

  await db.run('INSERT INTO approval_steps (id, warning_id, step, role, status, comment, operator_id, operated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['as001', 'w001', 1, 'enterprise', 'approved', '情况属实，我省多地养殖场确实面临亏损压力', 'u005', new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()]
  );

  await db.run('INSERT INTO approval_steps (id, warning_id, step, role, status) VALUES (?, ?, ?, ?, ?)',
    ['as002', 'w001', 2, 'provincial', 'pending']
  );

  await db.run('INSERT INTO approval_steps (id, warning_id, step, role, status) VALUES (?, ?, ?, ?, ?)',
    ['as003', 'w001', 3, 'national', 'pending']
  );

  for (let i = 0; i < 3; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekStr = `${weekStart.getFullYear()}年第${Math.ceil((weekStart.getDate() + 6) / 7)}周`;
    
    await db.run('INSERT INTO weekly_reports (id, week, province, inventory_yoy, disease_rate, cost_profit_analysis, recommendations, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        `wr${i + 1}`,
        weekStr,
        null,
        Math.round((Math.random() * 10 - 2) * 100) / 100,
        Math.round((1 + Math.random() * 2) * 100) / 100,
        '本周全国生猪养殖成本约16.8元/公斤，均价18.5元/公斤，头均盈利约180元。饲料成本占比约62%，人工成本占比约15%。',
        JSON.stringify([
          '建议适当控制补栏节奏，避免过度补栏三元杂交猪',
          '加强生物安全措施，重点防控非洲猪瘟',
          '关注玉米、豆粕价格走势，适时备货'
        ]),
        new Date().toISOString()
      ]
    );
  }

  const now = new Date();
  const months = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  await db.run('INSERT INTO forecasts (id, province, forecast_months, supply_forecast, supply_gap, feed_cost_forecast, recommended_strategy, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      'fc001',
      null,
      JSON.stringify(months),
      JSON.stringify([4200, 4350, 4500]),
      JSON.stringify([-50, 30, 180]),
      JSON.stringify([3.2, 3.35, 3.5]),
      '建议当前猪价处于上升通道，可适当压栏15-20天，同时补栏后备母猪以应对下半年供应缺口',
      0.85
    ]
  );

  console.log('Mock data seeded successfully');
}

export default initDatabase;
