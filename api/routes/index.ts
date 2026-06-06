
import { Router } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { login, getAllUsers, getUserById } from '../services/authService.js';
import {
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
  checkAndCreateWarnings
} from '../services/dataService.js';
import { getDb } from '../services/db.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = await login(username, password, role);
    if (user) {
      res.json({ success: true, user, token: 'mock-token-' + user.id });
    } else {
      res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, message: '用户不存在' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/metrics/national', async (req, res) => {
  try {
    const { date, province, startDate, endDate } = req.query;
    const metrics = await getNationalMetrics(
      date as string,
      province as string,
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/data/farms', async (req, res) => {
  try {
    const { province, city, startDate, endDate } = req.query;
    const data = await getFarmData(
      province as string,
      city as string,
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/data/slaughterhouses', async (req, res) => {
  try {
    const { province, city, startDate, endDate } = req.query;
    const data = await getSlaughterData(
      province as string,
      city as string,
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/data/markets', async (req, res) => {
  try {
    const { province, city, startDate, endDate } = req.query;
    const data = await getMarketData(
      province as string,
      city as string,
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/warnings', async (req, res) => {
  try {
    const { province, status } = req.query;
    const warnings = await getWarnings(province as string, status as string);
    res.json({ success: true, data: warnings });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/warnings/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { step, role, operatorId, comment } = req.body;
    const result = await approveWarningStep(id, step, role, operatorId, comment);
    res.json({ success: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/forecast', async (req, res) => {
  try {
    const { province } = req.query;
    const forecast = await getForecast(province as string);
    res.json({ success: true, data: forecast });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/forecast/generate', async (req, res) => {
  try {
    const { province } = req.body;
    const forecast = await generateForecast(province as string);
    res.json({ success: true, data: forecast });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/reports/weekly', async (req, res) => {
  try {
    const { province } = req.query;
    const reports = await getWeeklyReports(province as string);
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/feed-prices', async (req, res) => {
  try {
    const { province } = req.query;
    const prices = await getFeedPrices(province as string);
    res.json({ success: true, data: prices });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/warnings/check', async (req, res) => {
  try {
    const warnings = await checkAndCreateWarnings();
    res.json({ 
      success: true, 
      data: warnings,
      message: `检测完成，新增${warnings.length}条预警`
    });
  } catch (err) {
    console.error('预警检测失败:', err);
    res.status(500).json({ success: false, message: '预警检测失败' });
  }
});

router.post('/upload/excel', upload.single('file'), async (req, res) => {
  const db = await getDb();
  let insertedCount = 0;
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未上传文件' });
    }

    const type = req.body.type || 'sow';
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    await db.run('BEGIN TRANSACTION');
    
    if (type === 'sow') {
      for (const row of jsonData as any[]) {
        try {
          const province = row['省份'] || row['province'] || row['省'] || '未知';
          const sowCount = Number(row['能繁母猪存栏'] || row['sow_count'] || row['存栏'] || 0);
          const changeRate = Number(row['环比变化'] || row['change_rate'] || 0);
          const reportDate = row['日期'] || row['date'] || new Date().toISOString().split('T')[0];
          
          if (province && sowCount > 0) {
            const id = `sow_${province}_${reportDate}`.replace(/[^a-zA-Z0-9_]/g, '_');
            await db.run(
              `INSERT OR REPLACE INTO sow_inventory (id, province, sow_count, change_rate, report_date)
               VALUES (?, ?, ?, ?, ?)`,
              [id, String(province), sowCount, changeRate, String(reportDate)]
            );
            insertedCount++;
          }
        } catch (rowErr) {
          console.warn('跳过无效行:', rowErr);
        }
      }
    } else if (type === 'feed') {
      for (const row of jsonData as any[]) {
        try {
          const province = row['省份'] || row['province'] || row['省'] || '未知';
          const cornPrice = Number(row['玉米价格'] || row['corn_price'] || row['玉米'] || 0);
          const soybeanMealPrice = Number(row['豆粕价格'] || row['soybean_meal_price'] || row['豆粕'] || 0);
          const reportDate = row['日期'] || row['date'] || new Date().toISOString().split('T')[0];
          
          if (province && cornPrice > 0) {
            const id = `feed_${province}_${reportDate}`.replace(/[^a-zA-Z0-9_]/g, '_');
            await db.run(
              `INSERT OR REPLACE INTO feed_prices (id, province, corn_price, soybean_meal_price, report_date)
               VALUES (?, ?, ?, ?, ?)`,
              [id, String(province), cornPrice, soybeanMealPrice, String(reportDate)]
            );
            insertedCount++;
          }
        } catch (rowErr) {
          console.warn('跳过无效行:', rowErr);
        }
      }
    }

    await db.run('COMMIT');

    res.json({
      success: true,
      message: `文件解析成功，已写入${insertedCount}条数据`,
      data: {
        extracted: true,
        recordCount: insertedCount,
        totalRows: jsonData.length,
        sheetName,
        sowData: type === 'sow' ? jsonData.slice(0, 10) : [],
        feedData: type === 'feed' ? jsonData.slice(0, 10) : []
      }
    });
  } catch (err) {
    try {
      await db.run('ROLLBACK');
    } catch (rollbackErr) {
      console.error('回滚失败:', rollbackErr);
    }
    console.error('Excel处理失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '文件处理失败: ' + (err as Error).message,
      insertedCount: 0
    });
  }
});

export default router;
