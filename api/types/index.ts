
export type UserRole = 'national' | 'provincial' | 'municipal' | 'enterprise';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  province?: string;
  city?: string;
  permissions: string[];
}

export interface Farm {
  id: string;
  name: string;
  province: string;
  city: string;
  scale: 'small' | 'medium' | 'large';
  breed: string;
  managerId?: string;
}

export interface FarmData {
  id: string;
  farmId: string;
  farmName?: string;
  province?: string;
  city?: string;
  scale?: string;
  breed?: string;
  inventory: number;
  slaughter: number;
  feedConsumption: number;
  diseasePositiveRate: number;
  averageWeight: number;
  reportDate: string;
}

export interface Slaughterhouse {
  id: string;
  name: string;
  province: string;
  city: string;
  managerId?: string;
}

export interface SlaughterData {
  id: string;
  slaughterhouseId: string;
  slaughterhouseName?: string;
  province?: string;
  city?: string;
  slaughterVolume: number;
  carcassPrice: number;
  reportDate: string;
}

export interface Market {
  id: string;
  name: string;
  province: string;
  city: string;
}

export interface MarketData {
  id: string;
  marketId: string;
  marketName?: string;
  province?: string;
  city?: string;
  tradeVolume: number;
  averagePrice: number;
  reportDate: string;
}

export interface CoreMetrics {
  id?: string;
  province: string;
  city?: string;
  totalInventory: number;
  totalSlaughter: number;
  avgFeedConversionRatio: number;
  avgGrainRatio: number;
  inventoryChangeRate: number;
  avgSlaughterWeight: number;
  calculateDate: string;
}

export type WarningType = 'grain_ratio' | 'slaughter_drop';
export type WarningLevel = 'primary' | 'secondary';
export type WarningStatus = 'pending' | 'confirmed' | 'reviewed' | 'approved' | 'resolved';

export interface Warning {
  id: string;
  type: WarningType;
  level: WarningLevel;
  province: string;
  description: string;
  triggeredAt: string;
  status: WarningStatus;
  currentStep: number;
  approvalFlow?: ApprovalStep[];
}

export interface ApprovalStep {
  id: string;
  warningId: string;
  step: number;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  operatorId?: string;
  operatorName?: string;
  operatedAt?: string;
}

export interface ForecastResult {
  id?: string;
  province?: string;
  months: string[];
  supplyForecast: number[];
  supplyGap: number[];
  feedCostForecast: number[];
  recommendedStrategy: string;
  confidence: number;
  createdAt?: string;
}

export interface WeeklyReport {
  id: string;
  week: string;
  province?: string;
  inventoryYoY: number;
  diseaseRate: number;
  costProfitAnalysis: string;
  recommendations: string[];
  createdAt: string;
}

export interface FeedPrice {
  id: string;
  province: string;
  cornPrice: number;
  soybeanMealPrice: number;
  reportDate: string;
}
