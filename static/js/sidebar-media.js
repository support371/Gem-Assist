/**
 * GEM Enterprise - AI Media Generation Frontend
 * Enterprise-grade JavaScript for automated content creation
 * Handles API calls, UI interactions, and asset management
 */

// Configuration
const CONFIG = {
  API_BASE_URL: "/api/media",
  GENERATED_ASSETS_PATH: "/static/generated-assets",
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  POLLING_INTERVAL: 5000,
};

// Global state management
let activeRequests = new Map();
let generatedAssets = [];

/**
 * Utility Functions
 */

// Log function with timestamp
const log = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] [MediaGenerator] ${message}`, data);
};

// Show loading state
const showLoading = (elementId, message = "Processing...") => {
  const loadingElement = document.getElementById(elementId);
  if (loadingElement) {
    loadingElement.classList.add("active");
    const messageElement = loadingElement.querySelector(".loading-message");
    if (messageElement) {
      messageElement.textContent = message;
    }
  }
};

// Hide loading state
const hideLoading = (elementId) => {
  const loadingElement = document.getElementById(elementId);
  if (loadingElement) {
    loadingElement.classList.remove("active");
  }
};

// Show error message
const showError = (elementId, message) => {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add("active");
    setTimeout(() => {
      errorElement.classList.remove("active");
    }, 8000);
  }
  log("error", message);
};

// Show success message
const showSuccess = (elementId, message) => {
  const successElement = document.getElementById(elementId);
  if (successElement) {
    successElement.textContent = message;
    successElement.classList.add("active");
    setTimeout(() => {
      successElement.classList.remove("active");
    }, 5000);
  }
  log("info", message);
};

// Show preview with HTML snippet
const showPreview = (previewId, content, fileName, assetType) => {
  const previewElement = document.getElementById(previewId);
  const resultElement = previewElement?.querySelector(`#${assetType}-result`);
  const snippetElement = previewElement?.querySelector(`#${assetType}-snippet`);

  if (previewElement && resultElement) {
    // Set the media content
    if (assetType === "image") {
      resultElement.src = content;
      resultElement.alt = `Generated ${assetType}`;
    } else if (assetType === "video") {
      resultElement.src = content;
    } else if (assetType === "tts") {
      resultElement.src = content;
    }

    // Generate HTML snippet
    let snippet = "";
    if (assetType === "image") {
      snippet = `<img src="${content}" alt="Generated Image" class="img-fluid rounded">`;
    } else if (assetType === "video") {
      snippet = `<video src="${content}" controls class="w-100 rounded">\n  Your browser does not support the video tag.\n</video>`;
    } else if (assetType === "tts") {
      snippet = `<audio src="${content}" controls class="w-100">\n  Your browser does not support the audio tag.\n</audio>`;
    }

    if (snippetElement) {
      snippetElement.textContent = snippet;
    }

    // Save snippet to generated-assets folder
    saveSnippetToFile(fileName, snippet, assetType);

    previewElement.classList.add("active");
  }
};

// Save HTML snippet to file
const saveSnippetToFile = async (fileName, snippet, assetType) => {
  try {
    const snippetFileName = `${fileName.replace(/\.[^/.]+$/, "")}_snippet.html`;

    // Store in generated assets array
    generatedAssets.push({
      fileName: snippetFileName,
      type: "snippet",
      content: snippet,
      originalAsset: fileName,
      assetType,
      timestamp: new Date().toISOString(),
    });

    log("info", `HTML snippet generated for ${fileName}`, {
      snippet,
      fileName: snippetFileName,
    });
  } catch (error) {
    log("error", "Failed to save HTML snippet", {
      error: error.message,
      fileName,
    });
  }
};

// Make API request with retry logic
const apiRequest = async (endpoint, data, method = "POST") => {
  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  let lastError;

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      log("info", `API request attempt ${attempt}`, { url, method });

      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      };

      if (method !== "GET" && data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      log("info", "API request successful", { url, attempt, result });
      return result;
    } catch (error) {
      lastError = error;
      log("warn", `API request attempt ${attempt} failed`, {
        url,
        error: error.message,
      });

      if (attempt < CONFIG.MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.RETRY_DELAY * attempt),
        );
      }
    }
  }

  throw lastError;
};

/**
 * Media Generation Functions
 */

// Generate AI Image
const generateImage = async () => {
  const prompt = document.getElementById("image-prompt")?.value?.trim();
  const size = document.getElementById("image-size")?.value || "1024x1024";
  const style = document.getElementById("image-style")?.value || "vivid";

  if (!prompt) {
    showError("image-error", "Please enter an image description");
    return;
  }

  try {
    showLoading("image-loading", "Generating your professional image...");

    const result = await apiRequest("/image", {
      prompt,
      size,
      style,
    });

    if (result.success && result.url) {
      showPreview(
        "image-preview",
        result.url,
        result.metadata?.filename || "generated_image.png",
        "image",
      );
      showSuccess("image-success", `Image generated successfully!`);

      // Add to assets history
      addToAssetsHistory(
        result.metadata?.filename || "generated_image.png",
        "image",
        result.url,
      );
    } else {
      throw new Error(result.error || "Image generation failed");
    }
  } catch (error) {
    showError("image-error", `Image generation failed: ${error.message}`);
  } finally {
    hideLoading("image-loading");
  }
};

// Generate AI Video
const generateVideo = async () => {
  const prompt = document.getElementById("video-prompt")?.value?.trim();
  const duration =
    parseInt(document.getElementById("video-duration")?.value) || 4;

  if (!prompt) {
    showError("video-error", "Please enter a video description");
    return;
  }

  try {
    showLoading(
      "video-loading",
      "Starting video generation (this may take several minutes)...",
    );

    const result = await apiRequest("/video", {
      prompt,
      duration,
    });

    if (result.success && result.prediction_id) {
      // Poll for video completion
      await pollVideoStatus(result.prediction_id);
    } else {
      throw new Error(result.error || "Video generation failed");
    }
  } catch (error) {
    showError("video-error", `Video generation failed: ${error.message}`);
    hideLoading("video-loading");
  }
};

// Poll video generation status
const pollVideoStatus = async (predictionId) => {
  const maxAttempts = 60; // 5 minutes timeout
  let attempts = 0;

  const checkStatus = async () => {
    try {
      const result = await apiRequest(
        `/video/status/${predictionId}`,
        {},
        "GET",
      );

      if (result.success) {
        if (result.status === "completed" && result.url) {
          showPreview(
            "video-preview",
            result.url,
            result.metadata?.filename || "generated_video.mp4",
            "video",
          );
          showSuccess("video-success", `Video generated successfully!`);
          hideLoading("video-loading");
          return;
        } else if (result.status === "failed") {
          throw new Error("Video generation failed");
        } else if (result.status === "processing" && attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 5000);
          return;
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error("Video generation timeout");
      }
    } catch (error) {
      showError("video-error", `Video generation failed: ${error.message}`);
      hideLoading("video-loading");
    }
  };

  checkStatus();
};

// Generate Text-to-Speech
const generateTTS = async () => {
  const text = document.getElementById("tts-text")?.value?.trim();
  const voice = document.getElementById("tts-voice")?.value || "default";

  if (!text) {
    showError("tts-error", "Please enter text to convert to speech");
    return;
  }

  if (text.length > 2000) {
    showError(
      "tts-error",
      "Text is too long. Please keep it under 2000 characters.",
    );
    return;
  }

  try {
    showLoading("tts-loading", "Converting text to professional speech...");

    const result = await apiRequest("/tts", {
      text,
      voice,
    });

    if (result.success && result.url) {
      showPreview(
        "tts-preview",
        result.url,
        result.metadata?.filename || "generated_audio.mp3",
        "tts",
      );
      showSuccess("tts-success", `Audio generated successfully!`);

      // Add to assets history
      addToAssetsHistory(
        result.metadata?.filename || "generated_audio.mp3",
        "audio",
        result.url,
      );
    } else {
      throw new Error(result.error || "TTS generation failed");
    }
  } catch (error) {
    showError("tts-error", `TTS generation failed: ${error.message}`);
  } finally {
    hideLoading("tts-loading");
  }
};

// Send Chat Message
const sendChatMessage = async () => {
  const message = document.getElementById("chat-message")?.value?.trim();
  const sessionId =
    document.getElementById("conversation-id")?.value?.trim() ||
    `conv_${Date.now()}`;

  if (!message) {
    showError("chat-error", "Please enter a message");
    return;
  }

  try {
    showLoading(
      "chat-loading",
      "Processing your message with enterprise AI...",
    );

    const result = await apiRequest("/chat", {
      message,
      session_id: sessionId,
    });

    if (result.success && result.response) {
      const responseElement = document.getElementById("chat-response");
      if (responseElement) {
        responseElement.textContent = result.response;
      }

      document.getElementById("chat-preview").classList.add("active");
      document.getElementById("conversation-id").value = sessionId;

      showSuccess("chat-success", `Response generated (Session: ${sessionId})`);
    } else {
      throw new Error(result.error || "Chat processing failed");
    }
  } catch (error) {
    showError("chat-error", `Chat processing failed: ${error.message}`);
  } finally {
    hideLoading("chat-loading");
  }
};

// Place Voice Call
const placeVoiceCall = async () => {
  const phoneNumber = document.getElementById("call-number")?.value?.trim();
  const message = document.getElementById("call-message")?.value?.trim();
  const voice = document.getElementById("call-voice")?.value || "alice";

  if (!phoneNumber || !message) {
    showError("call-error", "Please enter both phone number and message");
    return;
  }

  // Validate phone number format
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    showError(
      "call-error",
      "Please enter phone number in international format (e.g., +1234567890)",
    );
    return;
  }

  try {
    showLoading("call-loading", "Placing professional voice call...");

    const result = await apiRequest("/call/place", {
      to_number: phoneNumber,
      message,
      voice,
    });

    if (result.success && result.call_sid) {
      const statusElement = document.getElementById("call-status");

      if (statusElement) {
        statusElement.innerHTML = `
                    <strong>Call Status:</strong> ${result.status}<br>
                    <strong>Call ID:</strong> ${result.call_sid}<br>
                    <strong>To:</strong> ${result.to_number}<br>
                    <strong>Voice:</strong> ${voice}<br>
                    <strong>Time:</strong> ${new Date().toLocaleString()}
                `;
      }

      document.getElementById("call-preview").classList.add("active");
      showSuccess(
        "call-success",
        `Call placed successfully to ${result.to_number}`,
      );
    } else {
      throw new Error(result.error || "Voice call failed");
    }
  } catch (error) {
    showError("call-error", `Voice call failed: ${error.message}`);
  } finally {
    hideLoading("call-loading");
  }
};

// Check System Status
const checkSystemStatus = async () => {
  try {
    showLoading("status-loading", "Checking system health...");

    const result = await apiRequest("/health", {}, "GET");

    const statusElement = document.getElementById("status-display");
    if (statusElement && result) {
      const services = result.services || {};
      const statusHtml = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Service Status:</h6>
                        <ul class="list-unstyled">
                            <li><i class="fas fa-${services.openai ? "check text-success" : "times text-danger"}"></i> OpenAI: ${services.openai ? "Connected" : "Disconnected"}</li>
                            <li><i class="fas fa-${services.elevenlabs ? "check text-success" : "times text-danger"}"></i> ElevenLabs: ${services.elevenlabs ? "Connected" : "Disconnected"}</li>
                            <li><i class="fas fa-${services.replicate ? "check text-success" : "times text-danger"}"></i> Replicate: ${services.replicate ? "Connected" : "Disconnected"}</li>
                            <li><i class="fas fa-${services.twilio ? "check text-success" : "times text-danger"}"></i> Twilio: ${services.twilio ? "Connected" : "Disconnected"}</li>
                            <li><i class="fas fa-${services.s3 ? "check text-success" : "times text-danger"}"></i> AWS S3: ${services.s3 ? "Connected" : "Disconnected"}</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h6>System Info:</h6>
                        <ul class="list-unstyled">
                            <li><strong>Status:</strong> ${result.status || "Unknown"}</li>
                            <li><strong>Timestamp:</strong> ${result.timestamp || new Date().toISOString()}</li>
                            <li><strong>Last Check:</strong> ${new Date().toLocaleString()}</li>
                        </ul>
                    </div>
                </div>
            `;
      statusElement.innerHTML = statusHtml;
    }

    document.getElementById("status-preview").classList.add("active");
  } catch (error) {
    showError("status-error", `Status check failed: ${error.message}`);
  } finally {
    hideLoading("status-loading");
  }
};

// Add to assets history
const addToAssetsHistory = (fileName, type, path) => {
  generatedAssets.push({
    fileName,
    type,
    path,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 10 assets
  if (generatedAssets.length > 10) {
    generatedAssets = generatedAssets.slice(-10);
  }

  log("info", "Asset added to history", { fileName, type, path });
};

/**
 * Event Listeners and Initialization
 */

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  log("info", "Media Generator initialized");

  // Attach event listeners
  const imageBtn = document.getElementById("generate-image-btn");
  const videoBtn = document.getElementById("generate-video-btn");
  const ttsBtn = document.getElementById("generate-tts-btn");
  const chatBtn = document.getElementById("send-chat-btn");
  const callBtn = document.getElementById("place-call-btn");
  const statusBtn = document.getElementById("check-status-btn");

  if (imageBtn) imageBtn.addEventListener("click", generateImage);
  if (videoBtn) videoBtn.addEventListener("click", generateVideo);
  if (ttsBtn) ttsBtn.addEventListener("click", generateTTS);
  if (chatBtn) chatBtn.addEventListener("click", sendChatMessage);
  if (callBtn) callBtn.addEventListener("click", placeVoiceCall);
  if (statusBtn) statusBtn.addEventListener("click", checkSystemStatus);

  // Input validation and character counters
  const ttsTextarea = document.getElementById("tts-text");
  if (ttsTextarea) {
    ttsTextarea.addEventListener("input", function () {
      const current = this.value.length;
      const max = 2000;
      log("debug", `TTS text length: ${current}/${max}`);
    });
  }

  // Auto-generate conversation IDs
  const conversationInput = document.getElementById("conversation-id");
  if (conversationInput && !conversationInput.value) {
    conversationInput.value = `conv_${Date.now()}`;
  }

  // Phone number formatting
  const phoneInput = document.getElementById("call-number");
  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      let value = this.value.replace(/[^\d+]/g, "");
      if (value && !value.startsWith("+")) {
        value = "+" + value;
      }
      this.value = value;
    });
  }

  // Check initial system status
  setTimeout(checkSystemStatus, 1000);

  log("info", "All event listeners attached successfully");
});

// Handle errors globally
window.addEventListener("error", function (event) {
  log("error", "Unhandled error in media generator", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Export functions for external use
window.MediaGenerator = {
  generateImage,
  generateVideo,
  generateTTS,
  sendChatMessage,
  placeVoiceCall,
  checkSystemStatus,
  getGeneratedAssets: () => generatedAssets,
  log,
};

log("info", "GEM Enterprise Media Generator loaded successfully");
