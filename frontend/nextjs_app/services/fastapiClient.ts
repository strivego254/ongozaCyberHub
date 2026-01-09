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

  /**
   * Profiling endpoints
   */
  profiling: {
    /**
     * Check profiling status
     */
    async checkStatus(): Promise<{
      completed: boolean;
      session_id: string | null;
      has_active_session: boolean;
      progress?: any;
      completed_at?: string;
    }> {
      return apiGateway.get('/profiling/status');
    },

    /**
     * Start profiling session
     */
    async startSession(): Promise<{
      session_id: string;
      status: string;
      progress: any;
      message: string;
    }> {
      return apiGateway.post('/profiling/session/start', {});
    },

    /**
     * Get all profiling questions
     */
    async getQuestions(): Promise<any[]> {
      return apiGateway.get('/profiling/questions');
    },

    /**
     * Submit question response
     */
    async submitResponse(
      sessionId: string,
      questionId: string,
      selectedOption: string
    ): Promise<{
      success: boolean;
      progress: any;
      message: string;
    }> {
      return apiGateway.post(`/profiling/session/${sessionId}/respond`, {
        question_id: questionId,
        selected_option: selectedOption,
      });
    },

    /**
     * Get session progress
     */
    async getProgress(sessionId: string): Promise<{
      session_id: string;
      current_question: number;
      total_questions: number;
      progress_percentage: number;
      estimated_time_remaining: number;
    }> {
      return apiGateway.get(`/profiling/session/${sessionId}/progress`);
    },

    /**
     * Complete profiling session
     */
    async completeSession(sessionId: string): Promise<{
      user_id: string;
      session_id: string;
      recommendations: any[];
      primary_track: any;
      assessment_summary: string;
      completed_at: string;
    }> {
      return apiGateway.post(`/profiling/session/${sessionId}/complete`, {});
    },

    /**
     * Get profiling results
     */
    async getResults(sessionId: string): Promise<{
      user_id: string;
      session_id: string;
      recommendations: any[];
      primary_track: any;
      assessment_summary: string;
      completed_at: string;
    }> {
      return apiGateway.get(`/profiling/session/${sessionId}/results`);
    },
  },
};

export default fastapiClient;

