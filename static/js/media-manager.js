// Media Manager for GEM Enterprise - Images and Videos

document.addEventListener("DOMContentLoaded", function () {
  initImageManager();
  initVideoManager();
  createMediaUploadInterface();
});

// Initialize image management
function initImageManager() {
  // Add image upload functionality to placeholders
  document.querySelectorAll(".image-placeholder").forEach((placeholder) => {
    addImageUploadHandler(placeholder);
  });

  // Optimize existing images
  optimizeExistingImages();
}

// Initialize video management
function initVideoManager() {
  // Add video upload functionality to video placeholders
  document.querySelectorAll(".video-placeholder").forEach((placeholder) => {
    addVideoUploadHandler(placeholder);
  });

  // Setup video embeds
  setupVideoEmbeds();
}

// Add image upload handler
function addImageUploadHandler(placeholder) {
  // Create upload button
  const uploadBtn = document.createElement("button");
  uploadBtn.className = "upload-btn";
  uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Image';
  uploadBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 8px 12px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        z-index: 10;
    `;

  placeholder.style.position = "relative";
  placeholder.appendChild(uploadBtn);

  uploadBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    openImageUpload(placeholder);
  });

  // Also allow clicking on placeholder
  placeholder.addEventListener("click", function () {
    if (!placeholder.querySelector("img")) {
      openImageUpload(placeholder);
    }
  });
}

// Add video upload handler
function addVideoUploadHandler(placeholder) {
  const uploadBtn = document.createElement("button");
  uploadBtn.className = "upload-btn";
  uploadBtn.innerHTML = '<i class="fas fa-video"></i> Add Video';
  uploadBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 8px 12px;
        background: var(--success-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        z-index: 10;
    `;

  placeholder.style.position = "relative";
  placeholder.appendChild(uploadBtn);

  uploadBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    openVideoUpload(placeholder);
  });
}

// Open image upload dialog
function openImageUpload(container) {
  const modal = createUploadModal("image");
  document.body.appendChild(modal);

  const fileInput = modal.querySelector("#file-input");
  const urlInput = modal.querySelector("#url-input");
  const uploadBtn = modal.querySelector("#upload-btn");
  const urlBtn = modal.querySelector("#url-btn");

  fileInput.addEventListener("change", function (e) {
    handleImageFile(e.target.files[0], container);
    document.body.removeChild(modal);
  });

  urlBtn.addEventListener("click", function () {
    const url = urlInput.value.trim();
    if (url) {
      handleImageUrl(url, container);
      document.body.removeChild(modal);
    }
  });

  modal.querySelector(".modal-close").addEventListener("click", function () {
    document.body.removeChild(modal);
  });
}

// Open video upload dialog
function openVideoUpload(container) {
  const modal = createUploadModal("video");
  document.body.appendChild(modal);

  const fileInput = modal.querySelector("#file-input");
  const urlInput = modal.querySelector("#url-input");
  const uploadBtn = modal.querySelector("#upload-btn");
  const urlBtn = modal.querySelector("#url-btn");

  fileInput.addEventListener("change", function (e) {
    handleVideoFile(e.target.files[0], container);
    document.body.removeChild(modal);
  });

  urlBtn.addEventListener("click", function () {
    const url = urlInput.value.trim();
    if (url) {
      handleVideoUrl(url, container);
      document.body.removeChild(modal);
    }
  });

  modal.querySelector(".modal-close").addEventListener("click", function () {
    document.body.removeChild(modal);
  });
}

// Create upload modal
function createUploadModal(type) {
  const modal = document.createElement("div");
  modal.className = "upload-modal";
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        position: relative;
    `;

  modalContent.innerHTML = `
        <button class="modal-close" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        <h3>Add ${type === "image" ? "Image" : "Video"}</h3>
        <div style="margin: 1rem 0;">
            <label style="display: block; margin-bottom: 0.5rem;">Upload ${type} file:</label>
            <input type="file" id="file-input" accept="${type === "image" ? "image/*" : "video/*"}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <button id="upload-btn" style="margin-top: 0.5rem; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">Upload File</button>
        </div>
        <div style="margin: 1rem 0; text-align: center;">
            <strong>OR</strong>
        </div>
        <div>
            <label style="display: block; margin-bottom: 0.5rem;">Enter ${type} URL:</label>
            <input type="url" id="url-input" placeholder="${type === "image" ? "https://example.com/image.jpg" : "https://youtube.com/watch?v=... or https://vimeo.com/..."}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <button id="url-btn" style="margin-top: 0.5rem; padding: 8px 16px; background: var(--success-color); color: white; border: none; border-radius: 4px; cursor: pointer;">Add ${type === "image" ? "Image" : "Video"}</button>
        </div>
        ${
          type === "image"
            ? `
        <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <small><strong>Recommended:</strong> Use high-quality images (1920x1080 or higher) for best results. JPEG for photos, PNG for graphics with transparency.</small>
        </div>
        `
            : `
        <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <small><strong>Supported:</strong> YouTube, Vimeo, or direct video files (MP4, WebM). For best performance, use YouTube or Vimeo links.</small>
        </div>
        `
        }
    `;

  modal.appendChild(modalContent);
  return modal;
}

// Handle image file upload
function handleImageFile(file, container) {
  if (!file || !file.type.startsWith("image/")) {
    alert("Please select a valid image file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    createImageElement(e.target.result, container, file.name);
  };
  reader.readAsDataURL(file);
}

// Handle image URL
function handleImageUrl(url, container) {
  if (!isValidImageUrl(url)) {
    alert("Please enter a valid image URL.");
    return;
  }

  createImageElement(url, container, "External Image");
}

// Handle video file upload
function handleVideoFile(file, container) {
  if (!file || !file.type.startsWith("video/")) {
    alert("Please select a valid video file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    createVideoElement(e.target.result, container, true);
  };
  reader.readAsDataURL(file);
}

// Handle video URL
function handleVideoUrl(url, container) {
  createVideoElement(url, container, false);
}

// Create image element
function createImageElement(src, container, alt) {
  // Clear container
  container.innerHTML = "";

  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.className = "responsive-image loaded";
  img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
    `;

  container.appendChild(img);
  container.classList.add("has-media");

  // Add edit button
  addEditButton(container, "image");
}

// Create video element
function createVideoElement(src, container, isFile) {
  // Clear container
  container.innerHTML = "";

  let videoElement;

  if (!isFile && (src.includes("youtube.com") || src.includes("youtu.be"))) {
    // YouTube embed
    const videoId = extractYouTubeId(src);
    if (videoId) {
      videoElement = document.createElement("iframe");
      videoElement.src = `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0`;
      videoElement.setAttribute("allowfullscreen", "");
      videoElement.style.cssText = `
                width: 100%;
                height: 100%;
                border: none;
                border-radius: 8px;
            `;
    }
  } else if (!isFile && src.includes("vimeo.com")) {
    // Vimeo embed
    const videoId = extractVimeoId(src);
    if (videoId) {
      videoElement = document.createElement("iframe");
      videoElement.src = `https://player.vimeo.com/video/${videoId}`;
      videoElement.setAttribute("allowfullscreen", "");
      videoElement.style.cssText = `
                width: 100%;
                height: 100%;
                border: none;
                border-radius: 8px;
            `;
    }
  } else {
    // Direct video file
    videoElement = document.createElement("video");
    videoElement.src = src;
    videoElement.controls = true;
    videoElement.className = "optimized-video";
    videoElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
        `;
  }

  if (videoElement) {
    container.appendChild(videoElement);
    container.classList.add("has-media");

    // Add edit button
    addEditButton(container, "video");
  } else {
    alert(
      "Invalid video URL. Please use YouTube, Vimeo, or a direct video file.",
    );
  }
}

// Add edit button to media containers
function addEditButton(container, type) {
  const editBtn = document.createElement("button");
  editBtn.className = "edit-media-btn";
  editBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
    `;

  editBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (type === "image") {
      openImageUpload(container);
    } else {
      openVideoUpload(container);
    }
  });

  container.appendChild(editBtn);
}

// Utility functions
function isValidImageUrl(url) {
  return (
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) ||
    url.includes("unsplash.com") ||
    url.includes("pexels.com")
  );
}

function extractYouTubeId(url) {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length == 11 ? match[7] : false;
}

function extractVimeoId(url) {
  const regExp = /^.*vimeo.com\/(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : false;
}

// Optimize existing images
function optimizeExistingImages() {
  document.querySelectorAll("img").forEach((img) => {
    if (!img.classList.contains("optimized")) {
      img.classList.add("responsive-image");
      img.loading = "lazy";
      img.classList.add("optimized");
    }
  });
}

// Setup video embeds
function setupVideoEmbeds() {
  // Convert video placeholder text to actual embeds where URLs are provided
  document.querySelectorAll(".video-placeholder").forEach((placeholder) => {
    const text = placeholder.textContent;
    if (text.includes("youtube.com") || text.includes("vimeo.com")) {
      const url = text.match(/(https?:\/\/[^\s]+)/);
      if (url) {
        handleVideoUrl(url[0], placeholder);
      }
    }
  });
}

// Create media upload interface
function createMediaUploadInterface() {
  // Add instructions to placeholders
  document
    .querySelectorAll(".image-placeholder, .video-placeholder")
    .forEach((placeholder) => {
      if (!placeholder.querySelector(".upload-instructions")) {
        const instructions = document.createElement("div");
        instructions.className = "upload-instructions";
        instructions.style.cssText = `
                position: absolute;
                bottom: 10px;
                left: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px;
                border-radius: 4px;
                font-size: 12px;
                text-align: center;
            `;
        instructions.innerHTML = `Click to add ${placeholder.classList.contains("image-placeholder") ? "image" : "video"}`;
        placeholder.appendChild(instructions);
      }
    });
}

// Export functions
window.GEMMedia = {
  addImage: handleImageUrl,
  addVideo: handleVideoUrl,
  optimizeImages: optimizeExistingImages,
};
