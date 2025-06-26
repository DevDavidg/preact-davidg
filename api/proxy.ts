// Esta es la API route de Vercel para hacer el proxy al API externo
const EXTERNAL_API_URL = 'https://drfapiprojects.onrender.com/projectcards/';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600'); // Cache 5min/10min

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir métodos GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Headers para el request al API externo
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Preact-Portfolio/1.0',
    };

    console.log('Fetching from external API:', EXTERNAL_API_URL);
    
    // Crear un AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

    try {
      // Hacer el request al API externo
      const response = await fetch(EXTERNAL_API_URL, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('External API error:', response.status, response.statusText);
        return res.status(response.status).json({
          error: 'External API error',
          status: response.status,
          statusText: response.statusText,
        });
      }

      // Obtener los datos como JSON
      const data = await response.json();
      
      console.log('Successfully fetched data, items count:', Array.isArray(data) ? data.length : 'unknown');

      // Retornar los datos
      return res.status(200).json(data);

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error: any) {
    console.error('Proxy error:', error);
    
    // Manejar diferentes tipos de errores
    if (error.name === 'AbortError') {
      return res.status(408).json({ error: 'Request timeout' });
    }

    if (error.message?.includes('fetch')) {
      return res.status(503).json({ error: 'Service unavailable' });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
