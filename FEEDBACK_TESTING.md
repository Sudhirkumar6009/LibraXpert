# Feedback API Test Guide

## Testing the Backend Feedback System

The feedback system has been successfully implemented with the following components:

### Backend Components Created:
1. **Model**: `backend/models/feedback.js` - MongoDB schema for feedback storage
2. **Routes**: `backend/routes/feedback_route.js` - API endpoints for feedback operations  
3. **Server Integration**: Updated `backend/server.js` to include feedback routes

### Frontend Components Updated:
1. **Feedback Form**: Updated `frontend/src/pages/Index.tsx` to submit to real API
2. **Admin Interface**: Created `frontend/src/pages/FeedbackManagement.tsx` for managing feedback

### API Endpoints Available:

#### Public Endpoints:
- `POST /api/feedback` - Submit new feedback (no authentication required)

#### Admin/Librarian Endpoints (require authentication):
- `GET /api/feedback` - Get all feedback with filters
- `GET /api/feedback/:id` - Get specific feedback by ID
- `PATCH /api/feedback/:id` - Update feedback status and add admin notes
- `DELETE /api/feedback/:id` - Delete feedback (admin only)
- `GET /api/feedback-stats` - Get feedback statistics

### Testing Instructions:

#### 1. Start the Backend Server:
```bash
cd backend
npm install  # if not already done
node server.js
```

#### 2. Test Feedback Submission:
Use curl or Postman to test the API:

```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "book-collection",
    "message": "This is a test feedback message",
    "rating": 5
  }'
```

#### 3. Test Frontend Integration:
1. Start the frontend development server
2. Navigate to the homepage
3. Scroll down to the feedback form
4. Fill out and submit the form
5. Check the browser console and network tab for API calls

#### 4. Test Admin Interface:
1. Log in as an admin or librarian
2. Navigate to `/feedback-management` (you may need to add this route to your router)
3. View submitted feedback and test status updates

### Database Storage:
Feedback is stored in MongoDB in the `feedback` collection with the following structure:
- `name`: String (required)
- `email`: String (required)  
- `subject`: Enum (required)
- `message`: String (required)
- `rating`: Number 1-5 (required)
- `userId`: ObjectId (optional, for authenticated users)
- `status`: Enum (pending/reviewed/resolved)
- `adminNotes`: String (optional)
- `createdAt`: Date
- `updatedAt`: Date

### Next Steps:
1. Add the feedback management route to your main router
2. Add navigation links for admins/librarians to access feedback management
3. Consider adding email notifications for new feedback
4. Add export functionality for feedback reports