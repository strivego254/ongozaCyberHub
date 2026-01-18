// Custom Grok client for X.AI API
export class GrokClient {
  private apiKey: string;
  private baseUrl = 'https://api.x.ai/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chatCompletion(messages: any[], options: any = {}) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'grok-beta',
        messages,
        temperature: options.temperature || 0.1,
        max_tokens: options.max_tokens || 4000,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

// Singleton instance
let grokInstance: GrokClient | null = null;

export function getGrokClient(): GrokClient | null {
  if (!grokInstance) {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      console.warn('GROK_API_KEY environment variable not set - Grok client unavailable');
      return null;
    }
    grokInstance = new GrokClient(apiKey);
  }
  return grokInstance;
}

export const grok = getGrokClient();
