export interface ComponentSummary {
  component_id: string;
  lot_id: string;
  value_0h: number;
  value_24h: number;
  predicted_value_168h: number;
  actual_value_168h?: number | null;
  risk_score: number;
  status: 'SAFE' | 'MONITOR' | 'HIGH_RISK';
  is_anomaly: boolean;
}

export interface DashboardSummary {
  total_components: number;
  safe_components: number;
  monitor_components: number;
  high_risk_components: number;
  anomalies_detected: number;
  avg_predicted_168h: number;
  model_mae: number;
  risk_distribution: {
    SAFE: number;
    MONITOR: number;
    HIGH_RISK: number;
  };
  components_by_lot: Record<string, number>;
  recent_high_risk: ComponentSummary[];
}

export interface MeasurementPoint {
  time_point: string;
  value: number;
  temperature: number;
}

export interface ComponentDetail {
  component_id: string;
  lot_id: string;
  temperature: number;
  risk_score: number;
  status: 'SAFE' | 'MONITOR' | 'HIGH_RISK';
  anomaly_score: number;
  is_anomaly: boolean;
  predicted_value_168h: number;
  actual_value_168h?: number | null;
  drift_rate_24h: number;
  percent_change_24h: number;
  lot_deviation_0h: number;
  z_score_0h: number;
  reasons: string[];
  measurement_history: MeasurementPoint[];
  explainability: {
    explainability_type?: string;
    contributions?: Record<string, {
      feature_value: number;
      shap_contribution: number;
    }>;
  };
}

export interface PaginatedComponents {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: ComponentSummary[];
}

export interface ModelMetrics {
  model_name: string;
  mae: number;
  rmse: number;
  r2: number;
  training_date: string;
  model_version: string;
  anomaly_report: Record<string, any>;
  feature_importances: Record<string, number>;
}

export interface PredictionRequest {
  component_id: string;
  lot_id: string;
  value_0h: number;
  value_24h: number;
  temperature: number;
}

export interface PredictionResponse {
  component_id: string;
  lot_id: string;
  anomaly_score: number;
  is_anomaly: boolean;
  predicted_value_168h: number;
  risk_score: number;
  status: 'SAFE' | 'MONITOR' | 'HIGH_RISK';
  reasons: string[];
}
