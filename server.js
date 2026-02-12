import http from "http";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

let mvpProcess = null;

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const readFileSafe = async (filePath) => {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};

const handleRunMvp = (res) => {
  if (!process.env.PERPLEXITY_API_KEY) {
    sendJson(res, 400, {
      error:
        "PERPLEXITY_API_KEY не задан. Добавьте ключ и повторите запуск AI-подбора."
    });
    return;
  }

  if (mvpProcess) {
    sendJson(res, 409, { error: "AI-подбор уже выполняется. Подождите." });
    return;
  }

  mvpProcess = spawn("node", ["runMVP.js"], {
    cwd: __dirname,
    env: process.env
  });

  let stderr = "";

  mvpProcess.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  mvpProcess.on("close", (code) => {
    mvpProcess = null;
    if (code !== 0) {
      console.error(stderr);
    }
  });

  sendJson(res, 202, { status: "started" });
};

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === "/api/run-mvp" && req.method === "POST") {
    handleRunMvp(res);
    return;
  }

  if (requestUrl.pathname === "/api/mvp-output" && req.method === "GET") {
    const outputPath = path.join(__dirname, "reports", "mvp-output.json");
    const data = await readFileSafe(outputPath);
    if (!data) {
      sendJson(res, 404, {
        error: "AI-отчёт не найден. Запустите AI-подбор."
      });
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(data);
    return;
  }

  // NEW: Recommend API using pipeline module
  if (requestUrl.pathname === "/api/recommend" && req.method === "GET") {
    try {
      const category = requestUrl.searchParams.get("category") || "drills";
      const query = requestUrl.searchParams.get("query") || "professional";
      
      console.log(`📦 Recommend API: ${category} / ${query}`);

      // Dynamically import pipeline
      const { default: pipeline } = await import('./modules/pipeline.js');
      
      // Initialize if needed
      if (!pipeline.initialized) {
        await pipeline.initialize();
      }

      // Get recommendations
      const searchResults = await pipeline.search(query, category);

      sendJson(res, 200, {
        success: true,
        query,
        category,
        results: {
          premium: searchResults.recommendations.premium ? [searchResults.recommendations.premium] : [],
          optimum: searchResults.recommendations.optimum ? [searchResults.recommendations.optimum] : [],
          economy: searchResults.recommendations.economy ? [searchResults.recommendations.economy] : []
        },
        timestamp: new Date().toISOString()
      });
      return;
    } catch (error) {
      console.error('❌ Recommend API error:', error);
      sendJson(res, 200, {
        success: false,
        error: error.message,
        results: {
          premium: [{
            id: 'fallback-1',
            name: 'Premium Option',
            price: 500,
            rating: 4.8,
            trust_score: 92
          }],
          optimum: [{
            id: 'fallback-2',
            name: 'Optimum Choice',
            price: 300,
            rating: 4.6,
            trust_score: 90
          }],
          economy: [{
            id: 'fallback-3',
            name: 'Economy Value',
            price: 150,
            rating: 4.2,
            trust_score: 82
          }]
        }
      });
      return;
    }
  }

  // NEW: Analytics API with price statistics and trends
  if (requestUrl.pathname === "/api/analytics" && req.method === "GET") {
    try {
      const { default: analytics } = await import('./modules/analytics.js');
      
      const dashboard = analytics.getDashboard();
      
      sendJson(res, 200, {
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString()
      });
      return;
    } catch (error) {
      console.error('❌ Analytics API error:', error);
      sendJson(res, 500, {
        success: false,
        error: error.message
      });
      return;
    }
  }

  // NEW: Get trends by category
  if (requestUrl.pathname === "/api/trends" && req.method === "GET") {
    try {
      const { default: analytics } = await import('./modules/analytics.js');
      
      const trends = analytics.getTrends();
      
      sendJson(res, 200, {
        success: true,
        data: trends,
        timestamp: new Date().toISOString()
      });
      return;
    } catch (error) {
      console.error('❌ Trends API error:', error);
      sendJson(res, 500, {
        success: false,
        error: error.message
      });
      return;
    }
  }
            rating: 4.2,
            trust_score: 82
          }]
        }
      });
      return;
    }
  }

  const safePath =
    requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.join(__dirname, safePath);

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server error");
  }
});

server.listen(PORT, () => {
  console.log(`✅ OPTIMARKET server running at http://localhost:${PORT}`);
});
