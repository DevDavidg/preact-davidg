import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Origin",
      "X-Requested-With",
      "Authorization",
    ],
  })
);

// Parse JSON bodies
app.use(express.json());

// Proxy endpoint for external API
app.get("/api/proxy", async (req, res) => {
  try {
    console.log("Proxying request to external API...");

    const response = await fetch(
      "https://drfapiprojects.onrender.com/projectcards/",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Portfolio-Proxy/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log(`Successfully fetched ${data.length} projects`);
    res.json(data);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(500).json({
      error: "Failed to fetch data from external API",
      message: error.message,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(
    `🚀 Development proxy server running on http://localhost:${PORT}`
  );
  console.log(`📡 API proxy available at http://localhost:${PORT}/api/proxy`);
  console.log(`💚 Health check at http://localhost:${PORT}/health`);
});

export default app;
