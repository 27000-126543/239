
import { getDb } from './db.js';
import type { CoreMetrics, FarmData, SlaughterData, MarketData, Warning, ApprovalStep, ForecastResult, WeeklyReport, FeedPrice } from '../types/index.js';

export async function getNationalMetrics(date?: string, province?: string, startDate?: string, endDate?: string): Promise<CoreMetrics[]> {
  const db = await getDb();
  let query = 'SELECT * FROM core_metrics WHERE 1=1';
  const params: any[] = [];
  
  if (date) {
    query += ' AND calculate_date = ?';
    params.push(date);
  }
  if (province) {
    query += ' AND province = ?';
    params.push(province);
  }
  if (startDate) {
    query += ' AND calculate_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND calculate_date <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY calculate_date DESC, province ASC';
  
  const metrics = await db.all(query, params);
  
  return metrics.map((m: any) => ({
    id: m.id,
    province: m.province,
    city: m.city,
    totalInventory: m.total_inventory,
    totalSlaughter: m.total_slaughter,
    avgFeedConversionRatio: m.avg_feed_conversion_ratio,
    avgGrainRatio: m.avg_grain_ratio,
    inventoryChangeRate: m.inventory_change_rate,
    avgSlaughterWeight: m.avg_slaughter_weight,
    calculateDate: m.calculate_date
  }));
}

export async function getFarmData(province?: string, city?: string, startDate?: string, endDate?: string): Promise<FarmData[]> {
  const db = await getDb();
  let query = `
    SELECT fd.*, f.name as farm_name, f.province, f.city, f.scale, f.breed
    FROM farm_data fd
    JOIN farms f ON fd.farm_id = f.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (province) {
    query += ' AND f.province = ?';
    params.push(province);
  }
  if (city) {
    query += ' AND f.city = ?';
    params.push(city);
  }
  if (startDate) {
    query += ' AND fd.report_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND fd.report_date <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY fd.report_date DESC LIMIT 500';
  
  const data = await db.all(query, params);
  
  return data.map((d: any) => ({
    id: d.id,
    farmId: d.farm_id,
    farmName: d.farm_name,
    province: d.province,
    city: d.city,
    scale: d.scale,
    breed: d.breed,
    inventory: d.inventory,
    slaughter: d.slaughter,
    feedConsumption: d.feed_consumption,
    diseasePositiveRate: d.disease_positive_rate,
    averageWeight: d.average_weight,
    reportDate: d.report_date
  }));
}

export async function getSlaughterData(province?: string, city?: string, startDate?: string, endDate?: string): Promise<SlaughterData[]> {
  const db = await getDb();
  let query = `
    SELECT sd.*, s.name as slaughterhouse_name, s.province, s.city
    FROM slaughter_data sd
    JOIN slaughterhouses s ON sd.slaughterhouse_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (province) {
    query += ' AND s.province = ?';
    params.push(province);
  }
  if (city) {
    query += ' AND s.city = ?';
    params.push(city);
  }
  if (startDate) {
    query += ' AND sd.report_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND sd.report_date <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY sd.report_date DESC LIMIT 500';
  
  const data = await db.all(query, params);
  
  return data.map((d: any) => ({
    id: d.id,
    slaughterhouseId: d.slaughterhouse_id,
    slaughterhouseName: d.slaughterhouse_name,
    province: d.province,
    city: d.city,
    slaughterVolume: d.slaughter_volume,
    carcassPrice: d.carcass_price,
    reportDate: d.report_date
  }));
}

export async function getMarketData(province?: string, city?: string, startDate?: string, endDate?: string): Promise<MarketData[]> {
  const db = await getDb();
  let query = `
    SELECT md.*, m.name as market_name, m.province, m.city
    FROM market_data md
    JOIN markets m ON md.market_id = m.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (province) {
    query += ' AND m.province = ?';
    params.push(province);
  }
  if (city) {
    query += ' AND m.city = ?';
    params.push(city);
  }
  if (startDate) {
    query += ' AND md.report_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND md.report_date <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY md.report_date DESC LIMIT 500';
  
  const data = await db.all(query, params);
  
  return data.map((d: any) => ({
    id: d.id,
    marketId: d.market_id,
    marketName: d.market_name,
    province: d.province,
    city: d.city,
    tradeVolume: d.trade_volume,
    averagePrice: d.average_price,
    reportDate: d.report_date
  }));
}

export async function getWarnings(province?: string, status?: string): Promise<Warning[]> {
  const db = await getDb();
  let query = 'SELECT * FROM warnings WHERE 1=1';
  const params: any[] = [];
  
  if (province) {
    query += ' AND province = ?';
    params.push(province);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY triggered_at DESC';
  
  const warnings = await db.all(query, params);
  
  const result = [];
  for (const w of warnings) {
    const steps = await db.all(
      'SELECT ast.*, u.name as operator_name FROM approval_steps ast LEFT JOIN users u ON ast.operator_id = u.id WHERE warning_id = ? ORDER BY step ASC',
      [w.id]
    );
    
    result.push({
      id: w.id,
      type: w.type,
      level: w.level,
      province: w.province,
      description: w.description,
      triggeredAt: w.triggered_at,
      status: w.status,
      currentStep: w.current_step,
      approvalFlow: steps.map((s: any) => ({
        id: s.id,
        warningId: s.warning_id,
        step: s.step,
        role: s.role,
        status: s.status,
        comment: s.comment,
        operatorId: s.operator_id,
        operatorName: s.operator_name,
        operatedAt: s.operated_at
      }))
    });
  }
  
  return result;
}

export async function approveWarningStep(warningId: string, step: number, role: string, operatorId: string, comment: string): Promise<boolean> {
  const db = await getDb();
  
  await db.run(
    'UPDATE approval_steps SET status = ?, comment = ?, operator_id = ?, operated_at = ? WHERE warning_id = ? AND step = ?',
    ['approved', comment, operatorId, new Date().toISOString(), warningId, step]
  );
  
  const newStep = step + 1;
  let newStatus = '';
  
  if (newStep === 1) newStatus = 'confirmed';
  else if (newStep === 2) newStatus = 'reviewed';
  else if (newStep === 3) newStatus = 'approved';
  else newStatus = 'resolved';
  
  await db.run(
    'UPDATE warnings SET current_step = ?, status = ? WHERE id = ?',
    [newStep, newStatus, warningId]
  );
  
  return true;
}

export async function getForecast(province?: string): Promise<ForecastResult | null> {
  const db = await getDb();
  
  let query = 'SELECT * FROM forecasts WHERE 1=1';
  const params: any[] = [];
  
  if (province) {
    query += ' AND province = ?';
    params.push(province);
  } else {
    query += ' AND province IS NULL';
  }
  
  query += ' ORDER BY created_at DESC LIMIT 1';
  
  const forecast = await db.get(query, params);
  
  if (!forecast) return null;
  
  return {
    id: forecast.id,
    province: forecast.province,
    months: JSON.parse(forecast.forecast_months),
    supplyForecast: JSON.parse(forecast.supply_forecast),
    supplyGap: JSON.parse(forecast.supply_gap),
    feedCostForecast: JSON.parse(forecast.feed_cost_forecast),
    recommendedStrategy: forecast.recommended_strategy,
    confidence: forecast.confidence,
    createdAt: forecast.created_at
  };
}

export async function generateForecast(province?: string): Promise<ForecastResult> {
  const db = await getDb();
  
  const now = new Date();
  const months = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  
  const baseSupply = 4200;
  const supplyForecast = months.map((_, i) => baseSupply + i * 150 + Math.floor(Math.random() * 100));
  const supplyGap = months.map((_, i) => (i - 1) * 80 + Math.floor(Math.random() * 60 - 30));
  const feedCostForecast = months.map((_, i) => 3.2 + i * 0.15 + Math.random() * 0.1);
  
  let strategy = '建议当前猪价处于上升通道，可适当压栏15-20天';
  if (supplyGap[2] > 100) {
    strategy = '预测未来3个月供应缺口较大，建议加快补栏节奏，重点补栏二元母猪';
  } else if (supplyGap[2] < -100) {
    strategy = '预测未来3个月供应过剩，建议适当压栏或调整出栏节奏，避免集中出栏';
  }
  
  const confidence = 0.75 + Math.random() * 0.2;
  
  const id = `fc${Date.now()}`;
  await db.run(
    'INSERT INTO forecasts (id, province, forecast_months, supply_forecast, supply_gap, feed_cost_forecast, recommended_strategy, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, province || null, JSON.stringify(months), JSON.stringify(supplyForecast), JSON.stringify(supplyGap), JSON.stringify(feedCostForecast), strategy, confidence]
  );
  
  return {
    id,
    province,
    months,
    supplyForecast,
    supplyGap,
    feedCostForecast,
    recommendedStrategy: strategy,
    confidence,
    createdAt: new Date().toISOString()
  };
}

export async function getWeeklyReports(province?: string): Promise<WeeklyReport[]> {
  const db = await getDb();
  let query = 'SELECT * FROM weekly_reports WHERE 1=1';
  const params: any[] = [];
  
  if (province) {
    query += ' AND province = ?';
    params.push(province);
  } else {
    query += ' AND province IS NULL';
  }
  
  query += ' ORDER BY created_at DESC LIMIT 10';
  
  const reports = await db.all(query, params);
  
  return reports.map((r: any) => ({
    id: r.id,
    week: r.week,
    province: r.province,
    inventoryYoY: r.inventory_yoy,
    diseaseRate: r.disease_rate,
    costProfitAnalysis: r.cost_profit_analysis,
    recommendations: JSON.parse(r.recommendations),
    createdAt: r.created_at
  }));
}

export async function getFeedPrices(province?: string): Promise<FeedPrice[]> {
  const db = await getDb();
  let query = 'SELECT * FROM feed_prices WHERE 1=1';
  const params: any[] = [];
  
  if (province) {
    query += ' AND province = ?';
    params.push(province);
  }
  
  const prices = await db.all(query, params);
  
  return prices.map((p: any) => ({
    id: p.id,
    province: p.province,
    cornPrice: p.corn_price,
    soybeanMealPrice: p.soybean_meal_price,
    reportDate: p.report_date
  }));
}

export async function checkAndCreateWarnings(): Promise<Warning[]> {
  const db = await getDb();
  const createdWarnings: Warning[] = [];
  
  const provinces = await db.all('SELECT DISTINCT province FROM core_metrics');
  
  for (const { province } of provinces) {
    const recentMetrics = await db.all(
      `SELECT * FROM core_metrics 
       WHERE province = ? 
       ORDER BY calculate_date DESC 
       LIMIT 10`,
      [province]
    );
    
    if (recentMetrics.length < 5) continue;
    
    const lowGrainRatioDays = recentMetrics.filter((m: any) => m.avg_grain_ratio < 5.0).length;
    if (lowGrainRatioDays >= 5) {
      const existingWarning = await db.get(
        `SELECT * FROM warnings 
         WHERE province = ? AND type = 'grain_ratio' AND status IN ('pending', 'confirmed', 'reviewed')
         ORDER BY triggered_at DESC LIMIT 1`,
        [province]
      );
      
      if (!existingWarning) {
        const warning = await createWarning(
          province,
          'grain_ratio',
          'primary',
          `${province}猪粮比已连续${lowGrainRatioDays}天低于5:1，低于盈亏平衡点，建议启动收储预案`
        );
        createdWarnings.push(warning);
      }
    }
    
    if (recentMetrics.length >= 8) {
      const recent7Days = recentMetrics.slice(0, 7);
      const prev7Days = recentMetrics.slice(7, 14);
      
      if (prev7Days.length >= 7) {
        const recentAvgSlaughter = recent7Days.reduce((sum: number, m: any) => sum + m.total_slaughter, 0) / 7;
        const prevAvgSlaughter = prev7Days.reduce((sum: number, m: any) => sum + m.total_slaughter, 0) / 7;
        const dropRate = ((prevAvgSlaughter - recentAvgSlaughter) / prevAvgSlaughter) * 100;
        
        if (dropRate >= 20) {
          const existingWarning = await db.get(
            `SELECT * FROM warnings 
             WHERE province = ? AND type = 'slaughter_drop' AND status IN ('pending', 'confirmed', 'reviewed')
             ORDER BY triggered_at DESC LIMIT 1`,
            [province]
          );
          
          if (!existingWarning) {
            const warning = await createWarning(
              province,
              'slaughter_drop',
              'primary',
              `${province}出栏量同比下降${dropRate.toFixed(1)}%，降幅超过20%阈值，建议启动临时补贴方案`
            );
            createdWarnings.push(warning);
          }
        }
      }
    }
  }
  
  return createdWarnings;
}

async function createWarning(province: string, type: string, level: string, description: string): Promise<Warning> {
  const db = await getDb();
  const id = `w${Date.now()}${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  
  await db.run(
    `INSERT INTO warnings (id, type, level, province, description, triggered_at, status, current_step)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', 0)`,
    [id, type, level, province, description, now]
  );
  
  const steps = [
    { step: 1, role: 'enterprise', status: 'pending' },
    { step: 2, role: 'provincial', status: 'pending' },
    { step: 3, role: 'national', status: 'pending' }
  ];
  
  for (const s of steps) {
    await db.run(
      `INSERT INTO approval_steps (id, warning_id, step, role, status)
       VALUES (?, ?, ?, ?, ?)`,
      [`${id}_s${s.step}`, id, s.step, s.role, s.status]
    );
  }
  
  return {
    id,
    type: type as any,
    level: level as any,
    province,
    description,
    triggeredAt: now,
    status: 'pending',
    currentStep: 0,
    approvalFlow: steps.map(s => ({
      id: `${id}_s${s.step}`,
      warningId: id,
      step: s.step,
      role: s.role,
      status: 'pending' as const
    }))
  };
}

export async function getCityDataByProvince(province: string): Promise<{
  cities: string[];
  trendData: { date: string; [key: string]: number | string }[];
  diseaseData: { city: string; positiveRate: number }[];
}> {
  const db = await getDb();
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDate = sevenDaysAgo.toISOString().split('T')[0];
  
  const farmData = await db.all(`
    SELECT fd.*, f.name as farm_name, f.province, f.city, f.scale, f.breed
    FROM farm_data fd
    JOIN farms f ON fd.farm_id = f.id
    WHERE f.province = ? AND fd.report_date >= ?
    ORDER BY fd.report_date ASC
  `, [province, startDate]);
  
  const cityMap = new Map<string, Map<string, { slaughter: number; diseasePositive: number; count: number }>>();
  const dateSet = new Set<string>();
  const citySet = new Set<string>();
  
  for (const d of farmData as any[]) {
    const city = d.city || '未知';
    const date = d.report_date;
    citySet.add(city);
    dateSet.add(date);
    
    if (!cityMap.has(city)) {
      cityMap.set(city, new Map());
    }
    const dateMap = cityMap.get(city)!;
    if (!dateMap.has(date)) {
      dateMap.set(date, { slaughter: 0, diseasePositive: 0, count: 0 });
    }
    const entry = dateMap.get(date)!;
    entry.slaughter += d.slaughter || 0;
    entry.diseasePositive += d.disease_positive_rate || 0;
    entry.count += 1;
  }
  
  const dates = Array.from(dateSet).sort();
  const cities = Array.from(citySet);
  
  const trendData = dates.map(date => {
    const row: any = { date };
    for (const city of cities) {
      const dateMap = cityMap.get(city);
      const entry = dateMap?.get(date);
      row[city] = entry ? entry.slaughter : 0;
    }
    return row;
  });
  
  const diseaseData = cities.map(city => {
    const dateMap = cityMap.get(city);
    let totalPositive = 0;
    let totalCount = 0;
    if (dateMap) {
      for (const entry of dateMap.values()) {
        totalPositive += entry.diseasePositive;
        totalCount += entry.count;
      }
    }
    return {
      city,
      positiveRate: totalCount > 0 ? Math.round(totalPositive / totalCount * 100) / 100 : 0
    };
  });
  
  return {
    cities,
    trendData,
    diseaseData
  };
}

export default {
  getNationalMetrics,
  getFarmData,
  getSlaughterData,
  getMarketData,
  getWarnings,
  approveWarningStep,
  getForecast,
  generateForecast,
  getWeeklyReports,
  getFeedPrices,
  checkAndCreateWarnings,
  getCityDataByProvince
};
