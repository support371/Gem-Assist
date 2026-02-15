# GEM Enterprise AI-Powered Website - Testing & Deployment Guide

## Overview

This document provides comprehensive testing instructions and deployment verification procedures for the GEM Enterprise AI-powered website platform.

## Prerequisites

### Local Development Environment

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Git

### Required API Keys & Services

- OpenAI API Key (for image generation, chat, GPT-5)
- ElevenLabs API Key (for text-to-speech)
- Replicate API Token (for video generation)
- Twilio Credentials (for voice calls and SMS)
- AWS/GCP Credentials (for cloud deployment)

## Local Testing

### 1. Environment Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd gem-enterprise

# Copy environment template
cp .env.example .env

# Edit .env with your actual API keys and configuration
nano .env
```

### 2. Python Backend Testing

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Run security scans
pip install bandit safety
bandit -r . --severity-level medium
safety check

# Run linting and formatting
pip install black flake8 mypy
black --check .
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
mypy . --ignore-missing-imports

# Set up test database
createdb gem_enterprise_test
export DATABASE_URL="postgresql://username:password@localhost:5432/gem_enterprise_test"

# Run Python tests
pip install pytest pytest-cov
pytest --cov=. --cov-report=html -v

# Start Flask development server
export FLASK_ENV=development
python app.py
```

### 3. Node.js Media Server Testing

```bash
# Install Node.js dependencies
npm install

# Run Node.js linting
npx eslint . --ext .js,.ts --max-warnings 0
npx prettier --check "**/*.{js,ts,json,css,md}"

# Run Node.js tests
npm test

# Start media server (in separate terminal)
npm run start:media
# OR
node server-media.js
```

### 4. Frontend Testing

```bash
# Build and optimize frontend assets
npm run build

# Test static asset generation
python -c "
import json, os, hashlib
manifest = {}
for root, dirs, files in os.walk('static'):
    for file in files:
        if file.endswith(('.css', '.js', '.png', '.jpg', '.svg')):
            path = os.path.join(root, file)
            with open(path, 'rb') as f:
                hash_md5 = hashlib.md5(f.read()).hexdigest()[:8]
            manifest[path] = f'{path}?v={hash_md5}'
print('Static assets manifest generated successfully')
"
```

## API Endpoint Testing

### 1. Health Check

```bash
curl -X GET http://localhost:5000/health
# Expected: {"status": "healthy", "timestamp": "...", "services": {...}}
```

### 2. Image Generation

```bash
curl -X POST http://localhost:3001/api/media/image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional corporate office with modern technology",
    "size": "1024x1024",
    "style": "vivid"
  }'
```

### 3. Text-to-Speech

```bash
curl -X POST http://localhost:3001/api/media/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to GEM Enterprise AI services",
    "voice": "Rachel",
    "model": "eleven_monolingual_v1"
  }'
```

### 4. AI Chat

```bash
curl -X POST http://localhost:3001/api/media/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What cybersecurity services do you offer?",
    "context": "enterprise",
    "conversationId": "test_conv_001"
  }'
```

### 5. Voice Call (Test Mode)

```bash
curl -X POST http://localhost:3001/api/media/call/place \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "This is a test call from GEM Enterprise",
    "voice": "alice"
  }'
```

## Browser Testing

### 1. Manual UI Testing

Navigate to each page and verify:

**Homepage (http://localhost:5000/)**

- [ ] Page loads without errors
- [ ] Navigation menu works
- [ ] Hero section displays correctly
- [ ] Service cards are responsive

**Media Generator (http://localhost:5000/media-generator)**

- [ ] All form sections load properly
- [ ] Input validation works
- [ ] Loading states display correctly
- [ ] Error messages show appropriately
- [ ] Generated content displays in preview areas
- [ ] HTML snippets are generated correctly

**Service Pages**

- [ ] `/about` - Company information loads
- [ ] `/services` - Service listings display
- [ ] `/contact` - Contact form functions
- [ ] `/leadership` - Team information shows

### 2. Automated Browser Testing

```bash
# Install Playwright
pip install playwright
playwright install chromium

# Run browser tests
python -c "
from playwright.sync_api import sync_playwright

def test_media_generator():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Test homepage
        page.goto('http://localhost:5000')
        assert 'GEM Enterprise' in page.title()

        # Test media generator
        page.goto('http://localhost:5000/media-generator')
        assert page.is_visible('#image-section')
        assert page.is_visible('#video-section')
        assert page.is_visible('#tts-section')

        # Test form interactions
        page.fill('#image-prompt', 'Test image prompt')
        page.click('#generate-image-btn')

        browser.close()
        print('✅ Browser tests passed')

test_media_generator()
"
```

### 3. Performance Testing

```bash
# Install performance testing tools
npm install -g lighthouse autocannon

# Run Lighthouse audit
lighthouse http://localhost:5000 --output json --output-path lighthouse-report.json

# Load testing
autocannon -c 10 -d 30 http://localhost:5000
```

## Security Testing

### 1. Dependency Vulnerability Scan

```bash
# Python dependencies
pip install safety
safety check

# Node.js dependencies
npm audit --audit-level high
```

### 2. Static Code Analysis

```bash
# Install semgrep
pip install semgrep

# Run security scan
semgrep --config=auto .
```

### 3. SSL/TLS Testing (Production)

```bash
# Test SSL configuration
curl -I https://your-domain.com
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## Database Testing

### 1. Connection Testing

```bash
# Test database connection
python -c "
import os
import psycopg2
from urllib.parse import urlparse

url = urlparse(os.environ['DATABASE_URL'])
conn = psycopg2.connect(
    database=url.path[1:],
    user=url.username,
    password=url.password,
    host=url.hostname,
    port=url.port
)
cursor = conn.cursor()
cursor.execute('SELECT version();')
print('Database connection successful:', cursor.fetchone())
conn.close()
"
```

### 2. Migration Testing

```bash
# Test database migrations
python -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('Database tables created successfully')
"
```

## Deployment Verification

### 1. AWS Deployment Testing

```bash
# Test AWS endpoints
AWS_URL="https://your-aws-domain.com"

# Health check
curl -f "$AWS_URL/health"

# Static assets
curl -f "$AWS_URL/static/css/style.css"

# API endpoints
curl -f "$AWS_URL/api/media/health"
```

### 2. GCP Deployment Testing

```bash
# Test GCP endpoints
GCP_URL="https://your-gcp-domain.com"

# Health check
curl -f "$GCP_URL/health"

# Performance test
curl -w "@-" -o /dev/null -s "$GCP_URL" << 'EOF'
    time_namelookup:  %{time_namelookup}s\n
    time_connect:     %{time_connect}s\n
    time_total:       %{time_total}s\n
EOF
```

### 3. CDN and Caching Testing

```bash
# Test CloudFront/Cloud CDN
curl -I "$AWS_URL/static/css/style.css" | grep -E "(X-Cache|CF-Cache-Status)"

# Test cache headers
curl -I "$AWS_URL" | grep -E "(Cache-Control|Expires)"
```

## Monitoring and Alerting

### 1. Health Monitoring

```bash
# Create health check script
cat > monitor.sh << 'EOF'
#!/bin/bash
ENDPOINTS=("http://localhost:5000/health" "http://localhost:3001/api/media/health")

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -f "$endpoint" > /dev/null 2>&1; then
        echo "✅ $endpoint is healthy"
    else
        echo "❌ $endpoint is down"
        exit 1
    fi
done
EOF

chmod +x monitor.sh
./monitor.sh
```

### 2. Log Monitoring

```bash
# Monitor application logs
tail -f app.log | grep -E "(ERROR|CRITICAL)"

# Monitor media server logs
tail -f media-server.log | grep -E "(error|failed)"
```

## Compliance Testing

### 1. GDPR Compliance

- [ ] Cookie consent mechanism
- [ ] Data deletion capabilities
- [ ] Privacy policy accessibility
- [ ] Data export functionality

### 2. Security Headers

```bash
# Check security headers
curl -I https://your-domain.com | grep -E "(Strict-Transport-Security|Content-Security-Policy|X-Frame-Options)"
```

### 3. Content Security Policy

```bash
# Validate CSP
python -c "
import requests
response = requests.get('https://your-domain.com')
csp = response.headers.get('Content-Security-Policy', '')
print('CSP Header:', csp)
assert 'default-src' in csp, 'Missing default-src directive'
print('✅ CSP validation passed')
"
```

## Troubleshooting

### Common Issues

**1. Database Connection Errors**

```bash
# Check database status
pg_isready -h localhost -p 5432

# Verify connection string
echo $DATABASE_URL
```

**2. API Key Issues**

```bash
# Verify environment variables
env | grep -E "(OPENAI|ELEVENLABS|TWILIO|AWS|GCP)"

# Test API connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

**3. Port Conflicts**

```bash
# Check what's running on ports
lsof -i :5000
lsof -i :3001

# Kill processes if needed
kill -9 $(lsof -t -i:5000)
```

**4. Static Asset Issues**

```bash
# Verify static files exist
ls -la static/css/
ls -la static/js/

# Check permissions
chmod -R 755 static/
```

### Performance Issues

**1. Slow API Responses**

```bash
# Monitor API response times
curl -w "@-" -o /dev/null -s http://localhost:3001/api/media/health << 'EOF'
time_total: %{time_total}s
EOF
```

**2. High Memory Usage**

```bash
# Monitor memory usage
ps aux | grep -E "(python|node)" | awk '{print $4, $11}' | sort -nr
```

## Continuous Integration

The GitHub Actions workflow automatically runs:

- Security scans (Bandit, Safety, npm audit)
- Code quality checks (Black, Flake8, ESLint, Prettier)
- Unit and integration tests
- End-to-end browser tests
- Deployment verification
- Performance monitoring

## Support and Documentation

For additional support:

1. Check the application logs for detailed error messages
2. Review the API documentation in the code comments
3. Verify all environment variables are properly configured
4. Ensure all required services (OpenAI, Twilio, etc.) are operational
5. Test in isolation to identify the specific component causing issues

## Success Criteria

Deployment is considered successful when:

- [ ] All health checks pass
- [ ] Static assets load correctly
- [ ] API endpoints respond within acceptable timeframes
- [ ] Database connections are stable
- [ ] Security scans show no critical vulnerabilities
- [ ] Performance metrics meet requirements
- [ ] Monitoring and alerting systems are functional
