import axios from 'axios';
import type { 
  DashboardSummary, 
  PaginatedComponents, 
  ComponentDetail, 
  ModelMetrics, 
  PredictionRequest, 
  PredictionResponse 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health check
  getHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },

  // Dashboard summary
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await client.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },

  // Paginated components
  getComponents: async (
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    lotId?: string,
    status?: string,
    sortBy: string = 'risk_score',
    sortDesc: boolean = true
  ): Promise<PaginatedComponents> => {
    const params: Record<string, any> = {
      page,
      page_size: pageSize,
      sort_by: sortBy,
      sort_desc: sortDesc,
    };
    if (search) params.search = search;
    if (lotId) params.lot_id = lotId;
    if (status && status !== 'ALL') params.status = status;

    const res = await client.get<PaginatedComponents>('/components', { params });
    return res.data;
  },

  // Single component detail
  getComponentDetail: async (componentId: string): Promise<ComponentDetail> => {
    const res = await client.get<ComponentDetail>(`/components/${componentId}`);
    return res.data;
  },

  // Real-time single component inference
  predictComponent: async (payload: PredictionRequest): Promise<PredictionResponse> => {
    const res = await client.post<PredictionResponse>('/predict', payload);
    return res.data;
  },

  // Model analytics
  getModelMetrics: async (): Promise<ModelMetrics> => {
    const res = await client.get<ModelMetrics>('/models/metrics');
    return res.data;
  },

  // Dataset Upload
  uploadCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/data/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Synthetic Demo Generation
  generateDemoData: async (numComponents: number = 1500) => {
    const res = await client.post('/data/generate-demo', null, {
      params: { num_components: numComponents }
    });
    return res.data;
  }
};
