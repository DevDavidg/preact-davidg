import type { VercelRequest, VercelResponse } from '@vercel/node';

// Configurar runtime para Node.js
export const config = {
  runtime: 'nodejs18.x',
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Solo permitir GET requests
  if (request.method !== 'GET') {
    return response.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are supported' 
    });
  }

  try {
    console.log('🚀 Fetching data from external API...');
    
    // Fetch del API externo con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    const apiResponse = await fetch(
      'https://drfapiprojects.onrender.com/projectcards/',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Vercel-Proxy/1.0',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      console.error(`❌ API responded with status: ${apiResponse.status}`);
      return response.status(apiResponse.status).json({
        error: 'External API error',
        status: apiResponse.status,
        message: apiResponse.statusText
      });
    }

    const data = await apiResponse.json();
    console.log(`✅ Successfully fetched ${Array.isArray(data) ? data.length : 'unknown'} items`);

    // Headers CORS y cache
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600'); // Cache 5min, stale 10min

    return response.status(200).json(data);

  } catch (error) {
    console.error('❌ Proxy error:', error);

    // Error específico para timeout
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
      return response.status(408).json({
        error: 'Request timeout',
        message: 'External API took too long to respond'
      });
    }

    // Error genérico
    return response.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch data from external API',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 