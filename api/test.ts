import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(request: VercelRequest, response: VercelResponse) {
  const { method } = request;
  
  if (method === 'GET') {
    return response.status(200).json({
      message: 'API Test working!',
      timestamp: new Date().toISOString(),
      method: method,
      url: request.url
    });
  }
  
  return response.status(405).json({ error: 'Method not allowed' });
} 