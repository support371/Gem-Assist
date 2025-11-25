const axios = require("axios");

class N8NClient {
  constructor(baseURL) {
    this.baseURL = baseURL.replace(/\/$/, "");
    this.client = axios.create({ baseURL: this.baseURL, timeout: 30000 });
  }

  async triggerWorkflow(workflowId, data = {}) {
    try {
      const response = await this.client.post(`/webhook/${workflowId}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async generateContent(topic, platforms = ["twitter"]) {
    return await this.triggerWorkflow("content-generator", {
      topic,
      platforms,
      timestamp: new Date().toISOString(),
      source: "replit",
    });
  }

  async processRSS(feedUrl, action = "summarize") {
    return await this.triggerWorkflow("rss-processor", {
      feed_url: feedUrl,
      action: action,
      output_format: "social_media",
      source: "replit",
    });
  }

  async dataPipeline(source, transformations = ["clean"]) {
    return await this.triggerWorkflow("data-pipeline", {
      pipeline: "replit-data",
      source: source,
      transformations: transformations,
      output: "database",
    });
  }
}

// Create instance with your n8n IP
const N8N_IP = process.env.N8N_IP || "YOUR_N8N_IP_HERE";
const n8n = new N8NClient(`http://${N8N_IP}:5678`);

module.exports = { n8n, N8NClient };
