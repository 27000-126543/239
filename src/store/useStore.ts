
import { create } from 'zustand';
import type { User, CoreMetrics, Warning, ForecastResult, WeeklyReport, FarmData, SlaughterData, MarketData } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  metrics: CoreMetrics[];
  warnings: Warning[];
  forecast: ForecastResult | null;
  reports: WeeklyReport[];
  farmData: FarmData[];
  slaughterData: SlaughterData[];
  marketData: MarketData[];
  loading: boolean;
  selectedProvince: string;
  selectedQuarter: string;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setMetrics: (metrics: CoreMetrics[]) => void;
  setWarnings: (warnings: Warning[]) => void;
  setForecast: (forecast: ForecastResult | null) => void;
  setReports: (reports: WeeklyReport[]) => void;
  setFarmData: (data: FarmData[]) => void;
  setSlaughterData: (data: SlaughterData[]) => void;
  setMarketData: (data: MarketData[]) => void;
  setLoading: (loading: boolean) => void;
  setSelectedProvince: (province: string) => void;
  setSelectedQuarter: (quarter: string) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  metrics: [],
  warnings: [],
  forecast: null,
  reports: [],
  farmData: [],
  slaughterData: [],
  marketData: [],
  loading: false,
  selectedProvince: '全国',
  selectedQuarter: '2026Q2',
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token });
  },
  setMetrics: (metrics) => set({ metrics }),
  setWarnings: (warnings) => set({ warnings }),
  setForecast: (forecast) => set({ forecast }),
  setReports: (reports) => set({ reports }),
  setFarmData: (farmData) => set({ farmData }),
  setSlaughterData: (slaughterData) => set({ slaughterData }),
  setMarketData: (marketData) => set({ marketData }),
  setLoading: (loading) => set({ loading }),
  setSelectedProvince: (selectedProvince) => set({ selectedProvince }),
  setSelectedQuarter: (selectedQuarter) => set({ selectedQuarter }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  }
}));
