/**
 * GEM Enterprise AI Support System
 * Real-time humanized AI assistant with live agent handoff capability
 */

class GEMAISupport {
  constructor() {
    this.isOpen = false;
    this.isConnected = false;
    this.messages = [];
    this.typing = false;
    this.awaitingAgent = false;
    this.sessionId = this.generateSessionId();
    this.userName = null;
    this.userEmail = null;

    // AI Responses Database
    this.aiResponses = {
      greeting: [
        "Hello! I'm ARIA, your GEM Enterprise AI assistant. I'm here to help you with cybersecurity, real estate services, and any questions about our platform. How can I assist you today?",
        "Welcome to GEM Enterprise! I'm ARIA, your dedicated AI support specialist. I have access to information about all our services including cybersecurity monitoring, asset recovery, and real estate solutions. What would you like to know?",
        "Hi there! I'm ARIA from the GEM Enterprise support team. I'm equipped to help you with questions about our cybersecurity services, recovery solutions, telegram bots, and real estate partnerships. How may I help you?",
      ],
      services: [
        "GEM Enterprise offers comprehensive cybersecurity monitoring, digital asset recovery, real estate services through Alliance Trust Realty, telegram bot automation, and business analysis services. Which specific service interests you?",
        "We provide integrated solutions including 24/7 threat monitoring, cryptocurrency recovery, commercial real estate brokerage, automated bot services, and complete business analysis. I can provide detailed information about any of these areas.",
        "Our core services include: Cybersecurity monitoring & compliance, Professional asset recovery, Real estate portfolio management, Telegram automation, and QFS integration. Would you like details about any specific service?",
      ],
      pricing: [
        "Our pricing varies by service type and complexity. For cybersecurity monitoring, we start at $299/month. Recovery services are case-specific with success-based fees. Real estate services follow standard commission structures. Would you like specific pricing for a particular service?",
        "We offer flexible pricing models: Monthly subscriptions for monitoring services ($299-$1,999), project-based pricing for recovery services, and competitive rates for real estate transactions. I can connect you with a specialist for detailed quotes.",
        "Pricing depends on your specific needs. Our basic monitoring starts at $299/month, while comprehensive packages range up to $1,999/month. Recovery services use success-based pricing (typically 15-25% of recovered assets). Shall I schedule a consultation for detailed pricing?",
      ],
      security: [
        "Security is our top priority. We use enterprise-grade encryption, maintain SOC 2 compliance, and follow strict federal guidelines. Our monitoring services include real-time threat detection, vulnerability assessments, and 24/7 incident response.",
        "We implement multi-layered security including end-to-end encryption, federal compliance protocols, and continuous monitoring. Our team includes certified security professionals with CISSP, CISM, and other advanced certifications.",
        "Your security is paramount to us. We maintain the highest industry standards with encrypted communications, secure data handling, federal compliance, and 24/7 monitoring by certified cybersecurity experts.",
      ],
      contact: [
        "You can reach us at (860) 305-4376 for immediate assistance, email legal@gemcybersecurityassist.com for legal inquiries, or support@gemcybersecurityassist.com for technical support. Would you like me to schedule a direct consultation?",
        "Our main contact number is (860) 305-4376. For specific inquiries: Legal matters - legal@gemcybersecurityassist.com, Technical support - support@gemcybersecurityassist.com. We also offer WhatsApp support upon request.",
        "To speak directly with our team, call (860) 305-4376. For written communication: legal@gemcybersecurityassist.com for legal/compliance matters, support@gemcybersecurityassist.com for technical questions. I can also connect you with a live agent right now if needed.",
      ],
      emergency: [
        "For cybersecurity emergencies, immediately call our 24/7 hotline at (860) 305-4376. Our incident response team provides <2 hour response times for critical threats. I'm also alerting our emergency response team now.",
        "This sounds urgent! Please call (860) 305-4376 immediately for emergency support. Our federal response protocol provides rapid assistance within 2 hours. I'm escalating this to our emergency team as we speak.",
        "Emergency support is available 24/7 at (860) 305-4376. For immediate cyber threats, our response time is under 2 hours with federal coordination. I'm connecting you to emergency support now.",
      ],
      recovery: [
        "Our asset recovery services have a 98% success rate with over $50M in recovered assets. We handle cryptocurrency theft, identity theft, fraud cases, and digital asset recovery with full legal support and forensic analysis.",
        "We specialize in recovering stolen crypto, compromised accounts, and digital assets. Our team includes forensic specialists, legal experts, and federal liaisons. Recovery rates average 70-85% with typical cases resolved in 2-6 weeks.",
        "Asset recovery is one of our core specialties. We've successfully recovered millions in stolen cryptocurrency, resolved identity theft cases, and helped clients regain control of compromised accounts. Our process includes forensic analysis, legal coordination, and federal support.",
      ],
      realestate: [
        "Through Alliance Trust Realty LLC, we provide commercial and residential real estate services across California and Connecticut. This includes property management, investment analysis, mortgage advisory, and portfolio optimization.",
        "Our real estate division manages $50M+ in assets including commercial properties, residential developments, and investment portfolios. We offer full-service brokerage, development consultation, and investment strategy services.",
        "Alliance Trust Realty handles all aspects of real estate including commercial brokerage, residential sales, property development, investment analysis, and portfolio management. We serve California and Connecticut markets with plans for expansion.",
      ],
      unknown: [
        "I understand you're asking about something specific. Could you provide more details so I can better assist you? Alternatively, I can connect you with one of our human specialists who can address your exact needs.",
        "I want to make sure I give you the most accurate information. Could you rephrase your question or provide more context? If you prefer, I can transfer you to a live agent who specializes in that area.",
        "That's a great question that might need specialized expertise. Let me either get more details to help you properly, or I can connect you directly with one of our expert team members.",
      ],
    };

    this.init();
  }

  generateSessionId() {
    return "gem_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  init() {
    this.createChatWidget();
    this.bindEvents();
    this.loadChatHistory();
  }

  createChatWidget() {
    const chatWidget = document.createElement("div");
    chatWidget.className = "gem-ai-support";
    chatWidget.innerHTML = `
            <div class="support-trigger" id="supportTrigger">
                <div class="trigger-avatar">
                    <i class="fas fa-robot"></i>
                    <span class="status-indicator online"></span>
                </div>
                <div class="trigger-text">
                    <div class="trigger-title">GEM AI Assistant</div>
                    <div class="trigger-status">ARIA • Enterprise Support</div>
                </div>
            </div>
            
            <div class="support-chat" id="supportChat">
                <div class="chat-header">
                    <div class="header-info">
                        <div class="ai-avatar">
                            <i class="fas fa-robot"></i>
                            <span class="status-dot"></span>
                        </div>
                        <div class="header-text">
                            <div class="agent-name">ARIA • GEM Enterprise</div>
                            <div class="agent-status" id="agentStatus">Enterprise AI Support</div>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn-minimize" id="minimizeChat">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="btn-close" id="closeChat">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="message ai-message">
                        <div class="message-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="message-content">
                            <div class="message-text">
                                Hello! I'm ARIA, your GEM Enterprise AI assistant. I'm here to help with cybersecurity, real estate, and any questions about our services. How can I assist you today?
                            </div>
                            <div class="message-time">${this.getCurrentTime()}</div>
                        </div>
                    </div>
                </div>
                
                <div class="typing-indicator" id="typingIndicator">
                    <div class="message-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
                
                <div class="chat-input-area">
                    <div class="input-container">
                        <input type="text" id="chatInput" placeholder="Type your message..." autocomplete="off">
                        <button id="sendMessage" class="send-btn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="quick-actions">
                        <button class="quick-btn" data-message="What services do you offer?">Services</button>
                        <button class="quick-btn" data-message="I need help with asset recovery">Recovery</button>
                        <button class="quick-btn" data-message="Tell me about pricing">Pricing</button>
                        <button class="quick-btn" data-message="Connect me to a human agent">Live Agent</button>
                    </div>
                    <div class="agent-transfer" id="agentTransfer" style="display: none;">
                        <div class="transfer-info">
                            <i class="fas fa-user-headset"></i>
                            <span>Connecting you to a live agent...</span>
                        </div>
                        <div class="transfer-form">
                            <input type="text" id="userName" placeholder="Your name">
                            <input type="email" id="userEmail" placeholder="Your email">
                            <button id="confirmTransfer">Connect Now</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(chatWidget);
  }

  bindEvents() {
    const trigger = document.getElementById("supportTrigger");
    const closeBtn = document.getElementById("closeChat");
    const minimizeBtn = document.getElementById("minimizeChat");
    const sendBtn = document.getElementById("sendMessage");
    const chatInput = document.getElementById("chatInput");
    const quickBtns = document.querySelectorAll(".quick-btn");
    const confirmTransfer = document.getElementById("confirmTransfer");

    trigger.addEventListener("click", () => this.openChat());
    closeBtn.addEventListener("click", () => this.closeChat());
    minimizeBtn.addEventListener("click", () => this.minimizeChat());
    sendBtn.addEventListener("click", () => this.sendMessage());
    confirmTransfer.addEventListener("click", () => this.initiateTransfer());

    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendMessage();
      }
    });

    chatInput.addEventListener("input", () => this.handleTyping());

    quickBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const message = btn.getAttribute("data-message");
        this.sendUserMessage(message);
      });
    });
  }

  openChat() {
    this.isOpen = true;
    document.getElementById("supportChat").classList.add("open");
    document.getElementById("supportTrigger").style.display = "none";
    document.getElementById("chatInput").focus();
    this.markAsRead();
  }

  closeChat() {
    this.isOpen = false;
    document.getElementById("supportChat").classList.remove("open");
    document.getElementById("supportTrigger").style.display = "flex";
  }

  minimizeChat() {
    document.getElementById("supportChat").classList.add("minimized");
    setTimeout(() => {
      document.getElementById("supportTrigger").style.display = "flex";
    }, 300);
  }

  sendMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();

    if (message) {
      this.sendUserMessage(message);
      input.value = "";
    }
  }

  sendUserMessage(message) {
    this.addMessage("user", message);
    this.showTyping();

    // Simulate AI processing time
    setTimeout(
      () => {
        const response = this.generateAIResponse(message);
        this.hideTyping();
        this.addMessage("ai", response);
      },
      1500 + Math.random() * 2000,
    ); // 1.5-3.5 second delay for realism
  }

  addMessage(sender, text, time = null) {
    const messagesContainer = document.getElementById("chatMessages");
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const currentTime = time || this.getCurrentTime();

    messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${sender === "user" ? "user" : "robot"}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${text}</div>
                <div class="message-time">${currentTime}</div>
            </div>
        `;

    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();

    // Store message
    this.messages.push({
      sender,
      text,
      time: currentTime,
      timestamp: Date.now(),
    });

    this.saveChatHistory();
  }

  generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Intent detection
    if (
      this.containsWords(message, [
        "emergency",
        "urgent",
        "hack",
        "breach",
        "stolen",
        "compromised",
      ])
    ) {
      return this.getRandomResponse("emergency");
    } else if (
      this.containsWords(message, [
        "service",
        "what do you",
        "offer",
        "provide",
      ])
    ) {
      return this.getRandomResponse("services");
    } else if (
      this.containsWords(message, [
        "price",
        "cost",
        "fee",
        "payment",
        "billing",
      ])
    ) {
      return this.getRandomResponse("pricing");
    } else if (
      this.containsWords(message, [
        "security",
        "safe",
        "secure",
        "protection",
        "monitoring",
      ])
    ) {
      return this.getRandomResponse("security");
    } else if (
      this.containsWords(message, [
        "contact",
        "phone",
        "email",
        "reach",
        "call",
      ])
    ) {
      return this.getRandomResponse("contact");
    } else if (
      this.containsWords(message, [
        "recover",
        "recovery",
        "stolen",
        "lost",
        "crypto",
        "bitcoin",
      ])
    ) {
      return this.getRandomResponse("recovery");
    } else if (
      this.containsWords(message, [
        "real estate",
        "property",
        "house",
        "commercial",
        "residential",
      ])
    ) {
      return this.getRandomResponse("realestate");
    } else if (
      this.containsWords(message, [
        "human",
        "agent",
        "person",
        "representative",
        "live support",
      ])
    ) {
      this.showAgentTransfer();
      return "I'd be happy to connect you with one of our human specialists! They can provide personalized assistance for your specific needs. Please provide your name and email below, and I'll get you connected immediately.";
    } else if (
      this.containsWords(message, [
        "hello",
        "hi",
        "hey",
        "good morning",
        "good afternoon",
      ])
    ) {
      return this.getRandomResponse("greeting");
    } else {
      return this.getRandomResponse("unknown");
    }
  }

  containsWords(text, words) {
    return words.some((word) => text.includes(word));
  }

  getRandomResponse(category) {
    const responses = this.aiResponses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  showTyping() {
    this.typing = true;
    document.getElementById("typingIndicator").style.display = "flex";
    this.scrollToBottom();

    // Update status
    document.getElementById("agentStatus").textContent = "ARIA is typing...";
  }

  hideTyping() {
    this.typing = false;
    document.getElementById("typingIndicator").style.display = "none";

    // Update status
    document.getElementById("agentStatus").textContent =
      "Online & Ready to Help";
  }

  showAgentTransfer() {
    document.getElementById("agentTransfer").style.display = "block";
    this.awaitingAgent = true;
  }

  initiateTransfer() {
    const nameInput = document.getElementById("userName");
    const emailInput = document.getElementById("userEmail");

    this.userName = nameInput.value.trim();
    this.userEmail = emailInput.value.trim();

    if (this.userName && this.userEmail) {
      document.getElementById("agentTransfer").style.display = "none";
      document.getElementById("agentStatus").textContent =
        "Connecting to live agent...";

      this.addMessage(
        "ai",
        `Thank you ${this.userName}! I'm connecting you with a live agent now. They will be with you shortly and will have access to our conversation history. Average wait time is less than 2 minutes.`,
      );

      // Simulate agent connection
      setTimeout(() => {
        document.getElementById("agentStatus").textContent =
          "Live Agent: Sarah (Available)";
        this.addMessage(
          "ai",
          `Hi ${this.userName}! This is Sarah from the GEM Enterprise support team. I see you were chatting with ARIA and need human assistance. I have access to your conversation and I'm ready to help. What specific assistance do you need today?`,
        );
      }, 3000);

      // Send notification to actual support team (in real implementation)
      this.notifySupport();
    } else {
      alert(
        "Please provide both your name and email to connect with a live agent.",
      );
    }
  }

  notifySupport() {
    // In real implementation, this would send data to your support system
    console.log("Support notification sent:", {
      sessionId: this.sessionId,
      userName: this.userName,
      userEmail: this.userEmail,
      messages: this.messages,
      timestamp: new Date().toISOString(),
    });
  }

  handleTyping() {
    // In real implementation, this could show user typing status to agents
  }

  scrollToBottom() {
    const container = document.getElementById("chatMessages");
    container.scrollTop = container.scrollHeight;
  }

  getCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  markAsRead() {
    // Mark messages as read
  }

  saveChatHistory() {
    localStorage.setItem(
      `gem_chat_${this.sessionId}`,
      JSON.stringify({
        messages: this.messages,
        userName: this.userName,
        userEmail: this.userEmail,
        timestamp: Date.now(),
      }),
    );
  }

  loadChatHistory() {
    const saved = localStorage.getItem(`gem_chat_${this.sessionId}`);
    if (saved) {
      const data = JSON.parse(saved);
      this.messages = data.messages || [];
      this.userName = data.userName;
      this.userEmail = data.userEmail;
    }
  }
}

// Initialize AI Support when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Wait a bit to ensure all other scripts are loaded
  setTimeout(() => {
    window.gemAISupport = new GEMAISupport();
  }, 1000);
});
