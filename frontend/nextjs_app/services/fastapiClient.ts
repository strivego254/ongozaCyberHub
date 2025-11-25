/**
 * FastAPI Client
 * Type-safe functions for FastAPI AI service endpoints
 */

import { apiGateway } from './apiGateway';
import type {
  RecommendationRequest,
  RecommendationResponse,
  PersonalityAnalysisRequest,
  PersonalityAnalysisResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  StoreEmbeddingRequest,
  StoreEmbeddingResponse,
} from './types';

/**
 * FastAPI AI Service Client
 */
export const fastapiClient = {
  /**
   * Recommendation endpoints
   */
  recommendations: {
    /**
     * Get personalized recommendations
     */
    async getRecommendations(data: RecommendationRequest): Promise<RecommendationResponse> {
      return apiGateway.post('/recommendations', data);
    },
  },

  /**
   * Personality analysis endpoints
   */
  personality: {
    /**
     * Analyze user personality
     */
    async analyzePersonality(data: PersonalityAnalysisRequest): Promise<PersonalityAnalysisResponse> {
      return apiGateway.post('/personality/analyze', data);
    },

    /**
     * Get stored personality analysis
     */
    async getPersonality(userId: number): Promise<PersonalityAnalysisResponse> {
      return apiGateway.get(`/personality/${userId}`);
    },
  },

  /**
   * Embedding endpoints
   */
  embeddings: {
    /**
     * Generate embeddings for texts
     */
    async generateEmbeddings(data: EmbeddingRequest): Promise<EmbeddingResponse> {
      return apiGateway.post('/embeddings', data);
    },

    /**
     * Store embeddings in vector database
     */
    async storeEmbeddings(data: StoreEmbeddingRequest): Promise<StoreEmbeddingResponse> {
      return apiGateway.post('/embeddings/store', data);
    },

    /**
     * Search similar embeddings
     */
    async searchSimilar(query: string, limit: number = 10): Promise<Array<{
      content_id: string;
      content_type: string;
      score: number;
      metadata?: Record<string, any>;
    }>> {
      return apiGateway.post('/embeddings/search', { query, limit });
    },
  },
};

export default fastapiClient;

