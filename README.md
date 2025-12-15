# 📚 LibraXpert

**Advanced Cross-Platform Library Management System**

A comprehensive, modern library management solution designed for educational institutions. LibraXpert streamlines the entire library workflow — from book cataloging and borrowing to reservations, returns, and user management — all through an intuitive, role-based interface.

---

## ✨ Key Features

### 📖 Book Catalog Management
- **Comprehensive Book Database** — Store detailed book information including title, author, ISBN, categories, publication year, publisher, and descriptions
- **Cover Image & PDF Support** — Upload book covers and PDF files with Firebase Storage integration
- **Smart Inventory Tracking** — Automatic tracking of total copies, available copies, and book status (available, reserved, borrowed, unavailable)
- **Full-Text Search** — Search across titles, authors, and descriptions with MongoDB text indexing
- **Categories & Tags** — Organize books with multiple categories and custom tags

### 🔄 Borrowing System
- **Borrow Request Workflow** — Students submit borrow requests; librarians approve or decline
- **Loan Management** — Track active loans with due dates and return status
- **Renewal System** — Request loan renewals with approval workflow
- **Overdue Detection** — Automatic tracking of overdue books
- **Return Processing** — Streamlined book return handling

### 📅 Reservations
- **Book Reservations** — Reserve books that are currently unavailable
- **Expiry Management** — Automatic reservation expiry handling
- **Notification on Availability** — Users notified when reserved books become available
- **Queue Management** — Track reservation queues for popular books

### 👥 User Management
- **Role-Based Access Control** — Four distinct user roles:
  - **Student** — Browse catalog, borrow books, make reservations
  - **External** — Limited access for external users
  - **Librarian** — Manage loans, process requests, handle returns
  - **Admin** — Full system access, user management, analytics
- **Enrollment Number Validation** — 12-digit enrollment number validation for students
- **Secure Authentication** — JWT-based authentication with bcrypt password hashing

### 🔔 Notifications
- **Real-Time Notifications** — In-app notification center
- **Multiple Notification Types**:
  - Due date reminders
  - Reservation updates
  - Overdue alerts
  - Feedback responses
  - System announcements
- **Mark as Read** — Track read/unread notification status

### 💬 Feedback System
- **User Feedback Collection** — Collect feedback on:
  - Book collection
  - Library services
  - Digital resources
  - Staff assistance
  - Facility issues
  - Technical issues
  - Suggestions
- **Star Rating System** — 1-5 star rating for feedback
- **Admin Review** — Admin notes and status tracking for feedback

### 📊 Admin Dashboard & Analytics
- **Dashboard Overview** — Quick stats on books, loans, and user activity
- **Popular Books** — Track most borrowed books
- **Top Authors** — Analytics on author popularity
- **Reports Generation** — Generate library usage reports
- **System Settings** — Configure system preferences

### 🎨 User Experience
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode** — Theme support with `next-themes`
- **Modern UI Components** — Built with shadcn/ui and Radix primitives
- **Smooth Animations** — Framer Motion powered animations
- **Interactive Charts** — Recharts integration for data visualization

---

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express 5** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM for MongoDB |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **Firebase Admin** | Cloud storage for files |
| **Multer** | File upload handling |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **TailwindCSS** | Styling |
| **shadcn/ui** | UI component library |
| **Radix UI** | Accessible primitives |
| **React Router 6** | Client-side routing |
| **TanStack Query** | Server state management |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |
| **Axios** | HTTP client |
| **Framer Motion** | Animations |
| **Recharts** | Charts & graphs |
| **Lucide React** | Icons |
| **date-fns** | Date utilities |

---

## 🔐 API Endpoints

### Authentication
- `POST /api/login` — User login
- `POST /api/register` — User registration

### Books
- `GET /api/books` — List all books
- `GET /api/books/:id` — Get book details
- `POST /api/books` — Add new book (Librarian/Admin)
- `PUT /api/books/:id` — Update book (Librarian/Admin)
- `DELETE /api/books/:id` — Delete book (Admin)

### Loans
- `GET /api/loans` — Get all loans (Librarian/Admin)
- `GET /api/loans/my-loans` — Get user's loans
- `POST /api/loans` — Create loan
- `PUT /api/loans/:id/return` — Process return

### Borrow Requests
- `GET /api/borrow-requests` — List requests (Librarian/Admin)
- `POST /api/borrow-requests` — Create request
- `PUT /api/borrow-requests/:id` — Process request

### Reservations
- `GET /api/reservations` — List reservations
- `POST /api/reservations` — Create reservation
- `PUT /api/reservations/:id` — Update reservation

### Notifications
- `GET /api/notifications` — Get user notifications
- `PUT /api/notifications/:id/read` — Mark as read

### Feedback
- `GET /api/feedback` — List feedback (Admin)
- `POST /api/feedback` — Submit feedback

---

## 👤 User Roles & Permissions

| Feature | Student | External | Librarian | Admin |
|---------|:-------:|:--------:|:---------:|:-----:|
| Browse Catalog | ✅ | ✅ | ✅ | ✅ |
| View Book Details | ✅ | ✅ | ✅ | ✅ |
| Borrow Books | ✅ | ❌ | ✅ | ✅ |
| Make Reservations | ✅ | ❌ | ✅ | ✅ |
| View Own Loans | ✅ | ❌ | ✅ | ✅ |
| Submit Feedback | ✅ | ✅ | ✅ | ✅ |
| Manage Borrow Requests | ❌ | ❌ | ✅ | ✅ |
| Process Returns | ❌ | ❌ | ✅ | ✅ |
| Manage Catalog | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ❌ | ❌ | ✅ |
| Manage Feedback | ❌ | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ✅ |

---

## 🌐 Deployment
Live Deployment : [LibraXpert](https://libraxpert.vercel.app/)

LibraXpert is designed for deployment on:
- **Frontend**: Vercel
- **Backend**: Render / Railway / Any Node.js hosting
- **Database**: MongoDB Atlas
- **File Storage**: Firebase Storage

---

## 📄 License

This project is licensed under the ISC License.

---

<div align="center">
  <strong>Built with ❤️ for modern libraries</strong>
</div>
