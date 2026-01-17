// Environment validation for AI features
export function validateAIEnvironment() {
  const required = [
    'GROK_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY'
  ];

  const optional = [
    'LLAMA_ENDPOINT',
    'ANTHROPIC_API_KEY',
    'GROQ_API_KEY',
    'GROQ_API_KEY_SECONDARY'
  ];

  const missing = required.filter(key => !process.env[key]);
  const warnings = optional.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (warnings.length > 0) {
    console.warn(`Optional environment variables not set: ${warnings.join(', ')}`);
    console.warn('Some AI features may not work without these variables.');
  }

  return {
    hasGrok: !!process.env.GROK_API_KEY,
    hasClaude: !!process.env.ANTHROPIC_API_KEY,
    hasGroq: !!process.env.GROQ_API_KEY,
    hasGroqSecondary: false, // Secondary models currently decommissioned
    hasLlama: !!process.env.LLAMA_ENDPOINT,
    supabaseConfigured: false // Converted to PostgreSQL
  };
}
