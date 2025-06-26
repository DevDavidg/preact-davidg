import type { VercelRequest, VercelResponse } from '@vercel/node';

// Configurar runtime para Node.js
export const config = {
  runtime: 'nodejs',
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
      const errorBody = await apiResponse.text(); // Get raw text to avoid JSON parse errors
      console.error(`❌ Error body from external API: ${errorBody}`);
      
      // Forward the exact status and a detailed error message
      return response.status(apiResponse.status).json({
        error: 'External API Error',
        proxy_status: apiResponse.status,
        proxy_message: apiResponse.statusText,
        external_api_body: errorBody,
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

    let errorDetails: Record<string, any> = {
        message: 'An unknown error occurred',
    };

    if (error instanceof Error) {
        errorDetails.message = error.message;
        errorDetails.name = error.name;
        errorDetails.stack = error.stack; // Might be useful
    } else if (typeof error === 'object' && error !== null) {
        errorDetails = { ...errorDetails, ...error };
    } else {
        errorDetails.message = String(error);
    }
    
    // Check for timeout specifically
    if (errorDetails.name === 'AbortError') {
      return response.status(408).json({
        error: 'Request Timeout',
        message: 'The request to the external API timed out (max 10s). This can happen on cold starts.',
        details: errorDetails,
      });
    }

    // Generic server error
    return response.status(500).json({
      error: 'Internal Server Error',
      message: 'The proxy encountered an unhandled error.',
      details: errorDetails,
    });
  }
} 