export default async function handler(req: any, res: any) {
  // Set CORS headers first
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Origin, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      "https://drfapiprojects.onrender.com/projectcards/",
      {
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "User-Agent": "Portfolio-App/1.0",
          "Origin": req.headers.origin || "http://localhost:5173",
        },
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Validate data structure
    if (!Array.isArray(data)) {
      throw new Error("Invalid data format: expected array");
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Proxy error:", error);
    
    if (error.name === "AbortError") {
      return res.status(408).json({ error: "Request timeout" });
    }
    
    if (error.message.includes("fetch")) {
      return res.status(503).json({ error: "Service unavailable" });
    }

    return res.status(500).json({ 
      error: "Failed to fetch data",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}
