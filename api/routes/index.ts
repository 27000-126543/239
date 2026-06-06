
import { Router } from 'express';
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
  getFeedPrices
} from '../services/dataService.js';

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
    const { date } = req.query;
    const metrics = await getNationalMetrics(date as string);
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

router.post('/upload/excel', async (req, res) => {
  try {
    res.json({
      success: true,
      message: '文件上传成功，已提取关键参数',
      data: {
        extracted: true,
        records: 156,
        parameters: ['能繁母猪存栏', '后备母猪数量', '存栏结构']
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '文件处理失败' });
  }
});

export default router;
