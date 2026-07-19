# AI Study Assistant - Setup Guide

## Overview
The AI Study Assistant is integrated into LibraXpert to help users with:
- Understanding book concepts (Explain Mode)
- Deciding what to read next (Next-Step Mode)
- Testing knowledge (Quiz Mode)
- Summarizing books (Summary Mode)
- Identifying weak areas (Weakness Detection)

## Backend Setup

### 1. Install Dependencies
No additional packages needed - uses existing Node.js/Express setup.

### 2. Configure AI Provider

Add to `backend/.env`:

```env
# Choose one provider
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key-here

# OR use Gemini
# AI_PROVIDER=gemini
# GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Get API Keys

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `.env` as `OPENAI_API_KEY`

**Gemini (Alternative):**
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Copy to `.env` as `GEMINI_API_KEY`

### 4. Start Backend
```bash
cd backend
npm run dev
```

## Frontend Setup

### 1. Environment Variables
Add to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

## Features

### 1. Explain Mode
- Explains any topic in simple terms
- Provides real examples
- Lists key points
- Suggests related books from library

### 2. Next-Step Mode
- Analyzes user's borrowing history
- Suggests next book based on interests
- Personalizes recommendations
- Shows top 3 suggestions

### 3. Quiz Mode
- Generates 3-5 questions on any topic
- Multiple choice format
- Based on library book content
- Tests understanding

### 4. Summary Mode
- Summarizes any book in max 7 bullet points
- Quick overview before borrowing
- Concise and actionable

### 5. Weakness Detection
- Identifies unexplored categories
- Suggests improvement areas
- Broadens knowledge base
- Top 3 weak areas shown

## Usage

### For Users
1. Login to LibraXpert
2. Click the AI Assistant button (bottom-right)
3. Select a mode (Explain, Next Step, Quiz, Summary, Improve)
4. Ask your question
5. Get personalized, actionable responses

### For Non-Logged Users
- Assistant prompts to login first
- No access without authentication

## API Endpoints

### POST `/api/assistant/chat`
**Request:**
```json
{
  "message": "What should I read about machine learning?",
  "mode": "next-step"
}
```

**Response:**
```json
{
  "answer": "Based on your history...",
  "whyMatters": "Personalized based on your reading history",
  "nextAction": "Check out: Introduction to ML",
  "data": {
    "suggestions": [
      { "id": "...", "title": "...", "author": "..." }
    ]
  }
}
```

### GET `/api/assistant/history`
Returns last 20 messages from user's session.

### POST `/api/assistant/search-books`
Search books by query (used internally by assistant).

## Security

- All endpoints require JWT authentication
- Assistant only answers library-related queries
- No external data access
- User context isolated per session

## Customization

### Adjust Response Length
Edit `assistant_route.js`:
```javascript
max_tokens: 500  // Change to 300 for shorter, 800 for longer
```

### Change AI Model
For OpenAI, edit:
```javascript
model: 'gpt-3.5-turbo'  // or 'gpt-4' for better quality
```

### Modify Modes
Add new modes in `assistant_route.js` and `AIAssistant.tsx`.

## Troubleshooting

**"AI API key not configured"**
- Check `.env` file has correct API key
- Restart backend server

**"Assistant unavailable"**
- Verify API key is valid
- Check internet connection
- Review backend logs

**"Session expired"**
- User needs to login again
- JWT token expired

## Cost Estimation

**OpenAI (GPT-3.5-turbo):**
- ~$0.002 per request (500 tokens)
- 1000 requests = ~$2

**Gemini:**
- Free tier: 60 requests/minute
- Paid: Similar to OpenAI pricing

## Production Deployment

1. Add API keys to hosting environment variables
2. Use production API URLs
3. Enable rate limiting
4. Monitor API usage
5. Set up error logging

## Support

For issues or questions:
- Check backend logs: `backend/server.js`
- Review API responses in browser console
- Verify authentication token is valid
