// server/api/n8n/calculate.post.ts
import { readBody, createError, defineEventHandler } from 'h3';
import { createClient } from '@supabase/supabase-js';
import { extractPQsFromArticle } from '@/utils/pqExtractor';
import { evaluate } from 'mathjs';
import { e3dMath } from '@/utils/libs/e3dMath';
import { 
  tpuuid2ShortId, 
  shortId2tpuuid, 
  isValidUuid, 
  isValidShortId,
  ensureShortId 
} from '@/utils/uuidHelpers';
// Lazy load unitConverter to avoid build-time initialization issues in Cloudflare Workers

interface CalculateRequest {
  articleId: string;
  inputs: Record<string, {
    value: number;
    unit: string;
  }>;
  outputs?: Record<string, {
    unit?: string; // Optional: preferred output unit
  }>; // Symbols with optional unit preferences
  apiKey: string;
}

interface CalculateResponse {
  success: boolean;
  timestamp: string;
  articleId: string;
  inputs: Record<string, {
    symbol: string;
    value: number;
    unit: string;
    baseValue: number;
    baseUnit: string;
  }>;
  outputs: Record<string, {
    symbol: string;
    value: number;
    unit: string;
    baseValue: number;
    baseUnit: string;
    expression?: string;
  }>;
  metadata: {
    totalPQs: number;
    calculationTime: number;
  };
}

// Mini calculator engine for stateless calculations
class StatelessCalculator {
  private pqs: Map<string, any> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private outputUnitPreferences: Record<string, string> = {};

  loadPQs(pqs: any[]) {
    this.pqs.clear();
    this.dependencyGraph.clear();
    
    // Load all PQs
    for (const pq of pqs) {
      this.pqs.set(pq.sym, pq);
      this.dependencyGraph.set(pq.sym, new Set());
    }
    
    // Build dependency graph
    for (const pq of pqs) {
      if (pq.expression) {
        const symbols = this.extractSymbolsFromExpression(pq.expression);
        for (const symbol of symbols) {
          if (this.pqs.has(symbol)) {
            this.dependencyGraph.get(pq.sym)?.add(symbol);
          }
        }
      }
    }
  }

  async updateInputs(inputs: Record<string, { value: number; unit: string }>) {
    const { unitConverter } = await import('../../utils/unitConverter');
    
    for (const [symbol, input] of Object.entries(inputs)) {
      const pq = this.pqs.get(symbol);
      if (pq && !pq.expression) { // Only update input PQs
        // Convert input value to base unit using proper unit converter
        const baseValue = await unitConverter.convert2base(input.value, input.unit);
        
        this.pqs.set(symbol, {
          ...pq,
          faceValue: input.value,
          faceUnit: input.unit,
          baseValue: baseValue
        });
      }
    }
  }

  async setOutputUnitPreferences(outputs: Record<string, { unit?: string }>) {
    const { unitConverter } = await import('../../utils/unitConverter');
    
    this.outputUnitPreferences = {};
    for (const [symbol, config] of Object.entries(outputs)) {
      if (config.unit) {
        // Validate unit compatibility
        const pq = this.pqs.get(symbol);
        if (pq) {
          try {
            // Test conversion to validate unit compatibility
            await unitConverter.convert(1, pq.baseUnit, config.unit);
            this.outputUnitPreferences[symbol] = config.unit;
          } catch (error) {
            console.warn(`Invalid output unit ${config.unit} for PQ ${symbol}: ${error.message}`);
            // Keep original unit if conversion fails
          }
        }
      }
    }
  }

  getPreferredOutputUnit(symbol: string, originalUnit: string): string {
    return this.outputUnitPreferences[symbol] || originalUnit;
  }

  async calculateAll(): Promise<Record<string, any>> {
    const { unitConverter } = await import('../../utils/unitConverter');
    
    const results: Record<string, any> = {};
    const calculated = new Set<string>();
    
    // Calculate in dependency order
    const toCalculate = Array.from(this.pqs.keys());
    
    while (toCalculate.length > 0) {
      const symbol = toCalculate.shift()!;
      const pq = this.pqs.get(symbol)!;
      
      if (!pq.expression) {
        // Input PQ - already has value
        results[symbol] = {
          symbol,
          value: pq.faceValue,
          unit: pq.faceUnit,
          baseValue: pq.baseValue,
          baseUnit: pq.baseUnit
        };
        calculated.add(symbol);
      } else {
        // Check if all dependencies are calculated
        const deps = this.dependencyGraph.get(symbol) || new Set();
        const allDepsCalculated = Array.from(deps).every(dep => calculated.has(dep));
        
        if (allDepsCalculated) {
          try {
            // Create evaluation context
            const context: Record<string, number> = {};
            for (const dep of deps) {
              const depPQ = this.pqs.get(dep)!;
              context[dep] = depPQ.baseValue;
            }
            
            // Evaluate expression
            const result = evaluate(pq.expression, context);
            const baseValue = typeof result === 'number' ? result : 0;
            
            // Convert to preferred output unit or use original face unit
            const outputUnit = this.getPreferredOutputUnit(pq.sym, pq.faceUnit);
            const faceValue = await unitConverter.convert2face(baseValue, outputUnit);
            
            results[symbol] = {
              symbol,
              value: faceValue,
              unit: outputUnit,
              baseValue: baseValue,
              baseUnit: pq.baseUnit,
              expression: pq.expression
            };
            
            // Update PQ with calculated value
            this.pqs.set(symbol, {
              ...pq,
              faceValue: faceValue,
              baseValue: baseValue
            });
            
            calculated.add(symbol);
          } catch (error) {
            console.error(`Error calculating ${symbol}:`, error);
            results[symbol] = {
              symbol,
              value: 0,
              unit: pq.faceUnit,
              baseValue: 0,
              baseUnit: pq.baseUnit,
              expression: pq.expression,
              error: error.message
            };
            calculated.add(symbol);
          }
        } else {
          // Put back at end of queue
          toCalculate.push(symbol);
        }
      }
    }
    
    return results;
  }

  private extractSymbolsFromExpression(expression: string): string[] {
    // Simple regex to extract potential symbols
    const matches = expression.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    return matches.filter(match => 
      !['sin', 'cos', 'tan', 'sqrt', 'log', 'ln', 'pi', 'e', 'PI', 'E'].includes(match)
    );
  }
}

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  
  try {
    const body = await readBody<CalculateRequest>(event);
    const { articleId, inputs, outputs, apiKey } = body;

    if (!articleId || !apiKey) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameters: articleId and apiKey'
      });
    }

    // Get runtime config
    const config = useRuntimeConfig();
    const supabase = createClient(
      config.public.supabaseUrl,
      config.supabaseServiceKey
    );

    // 1. Validate API key and get user info
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('embed_api_keys')
      .select(`
        id,
        user_id,
        api_key,
        allowed_domains,
        is_active,
        expires_at
      `)
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (apiKeyError || !apiKeyData) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or inactive API key'
      });
    }

    // 2. Check if API key has expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      throw createError({
        statusCode: 401,
        statusMessage: 'API key has expired'
      });
    }

    // 3. Check user's subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', apiKeyData.user_id)
      .single();

    if (profileError || !profile) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User profile not found'
      });
    }

    const allowedTiers = ['basic', 'premium'];
    if (!allowedTiers.includes(profile.subscription_tier) || profile.subscription_status !== 'active') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Active BASIC or PREMIUM subscription required for API access'
      });
    }

    // 4. Load article - try short_id first, then UUID
    let { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, content, access_level, owner_id, short_id, title')
      .eq('short_id', articleId)
      .single();

    if (articleError || !article) {
      // Try UUID format
      const result = await supabase
        .from('articles')
        .select('id, content, access_level, owner_id, short_id, title')
        .eq('id', articleId)
        .single();
      
      article = result.data;
      articleError = result.error;
    }

    if (articleError || !article) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Article not found'
      });
    }

    // 5. Check article permissions
    if (article.access_level !== 'public') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only public articles can be accessed via API'
      });
    }

    if (article.owner_id !== apiKeyData.user_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only access your own articles'
      });
    }

    // 6. Extract PQs from article content
    const articleData = {
      id: article.short_id || tpuuid2ShortId(article.id),
      title: article.title,
      content: article.content,
      // ... other fields not needed for PQ extraction
    };

    const pqs = extractPQsFromArticle(articleData);
    
    if (pqs.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No physical quantities found in article'
      });
    }

    // 7. Perform stateless calculation
    const calculator = new StatelessCalculator();
    calculator.loadPQs(pqs);
    await calculator.updateInputs(inputs);
    
    // Set output unit preferences if provided
    if (outputs) {
      await calculator.setOutputUnitPreferences(outputs);
    }
    
    const allResults = await calculator.calculateAll();

    // 8. Filter results based on request
    const inputResults: Record<string, any> = {};
    const outputResults: Record<string, any> = {};

    for (const [symbol, result] of Object.entries(allResults)) {
      if (inputs[symbol]) {
        // Return all input PQs that were provided
        inputResults[symbol] = result;
      } else {
        // For outputs: return all if outputs not specified, or only requested ones if specified
        if (!outputs || outputs[symbol] !== undefined) {
          outputResults[symbol] = result;
        }
      }
    }

    // 9. Log API usage with enhanced tracking
    try {
      await supabase.rpc('log_api_usage', {
        p_api_key_id: apiKeyData.id,
        p_short_id: articleId,
        p_service_type: 'n8n',
        p_request_data: { 
          inputs: Object.keys(inputs), 
          outputs: outputs ? Object.keys(outputs) : [],
          inputCount: Object.keys(inputs).length,
          outputCount: Object.keys(outputResults).length
        },
        p_response_status: 200,
        p_processing_time_ms: Date.now() - startTime
      });
    } catch (logError) {
      console.warn('Failed to log API usage:', logError);
    }

    const response: CalculateResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      articleId,
      inputs: inputResults,
      outputs: outputResults,
      metadata: {
        totalPQs: pqs.length,
        calculationTime: Date.now() - startTime
      }
    };

    return response;

  } catch (error) {
    console.error('n8n calculation error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during calculation'
    });
  }
});