import { apiRequest, type ApiResponse } from './api';

// Interface for health check response
export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  services: Array<{
    name: string;
    status: string;
  }>;
}

/**
 * Checks the health status of the API
 * @returns Promise with API response containing health information
 */
export const checkHealth = async (): Promise<ApiResponse<HealthResponse>> => {
  console.log('🏥 Checking API health...');
  
  try {
    const response = await apiRequest<HealthResponse>('/health', {
      method: 'GET',
    });

    if (response.success) {
      console.log('✅ Health check successful:', response.data);
    } else {
      console.error('❌ Health check failed:', response.error);
    }

    return response;
  } catch (error) {
    console.error('❌ Health service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check health',
    };
  }
};
