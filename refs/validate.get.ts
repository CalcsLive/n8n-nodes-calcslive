// server/api/n8n/validate.get.ts
import { createError, defineEventHandler, getQuery } from 'h3';
import { createClient } from '@supabase/supabase-js';
import { extractPQsFromArticle } from '@/utils/pqExtractor';
import { tpuuid2ShortId, shortId2tpuuid, isValidUuid, isValidShortId, ensureShortId } from '@/utils/uuidHelpers';

interface ValidateResponse {
  success: boolean;
  message: string;
  articleId: string;
  articleTitle: string;
  metadata: {
    totalPQs: number;
    inputPQs: PQInfo[];
    outputPQs: PQInfo[];
    availableUnits: Record<string, string[]>; // categoryId -> available units
  };
}

interface PQInfo {
  symbol: string;
  description?: string;
  unit: string;
  baseUnit: string;
  categoryId: string;
  type: 'input' | 'output';
  expression?: string;
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { articleId, apiKey } = query;

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

    // 7. Analyze PQs and categorize them
    const inputPQs: PQInfo[] = [];
    const outputPQs: PQInfo[] = [];
    const availableUnits: Record<string, string[]> = {};

    for (const pq of pqs) {
      const pqInfo: PQInfo = {
        symbol: pq.sym,
        description: pq.description,
        unit: pq.faceUnit,
        baseUnit: pq.baseUnit,
        categoryId: pq.categoryId,
        type: pq.expression ? 'output' : 'input',
        expression: pq.expression
      };

      if (pq.expression) {
        outputPQs.push(pqInfo);
      } else {
        inputPQs.push(pqInfo);
      }

      // Track available units for this category using actual units data
      if (!availableUnits[pq.categoryId]) {
        try {
          // Use your existing unitConverter to get all compatible units
          const { unitConverter } = await import('../../utils/unitConverter');
          availableUnits[pq.categoryId] = await unitConverter.getCompatibleUnits(pq.faceUnit);
        } catch (error) {
          console.warn('Could not load units for category:', pq.categoryId, error);
          availableUnits[pq.categoryId] = [pq.faceUnit, pq.baseUnit];
        }
      }
    }

    // 8. Log validation request with enhanced tracking
    try {
      await supabase.rpc('log_api_usage', {
        p_api_key_id: apiKeyData.id,
        p_short_id: articleId,
        p_service_type: 'n8n',
        p_request_data: { 
          action: 'validate',
          totalPQs: pqs.length,
          inputPQs: inputPQs.length,
          outputPQs: outputPQs.length
        },
        p_response_status: 200
      });
    } catch (logError) {
      console.warn('Failed to log validation request:', logError);
    }

    const response: ValidateResponse = {
      success: true,
      message: 'Article validation successful',
      articleId: articleId.toString(),
      articleTitle: article.title,
      metadata: {
        totalPQs: pqs.length,
        inputPQs,
        outputPQs,
        availableUnits
      }
    };

    return response;

  } catch (error) {
    console.error('n8n validation error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during validation'
    });
  }
});