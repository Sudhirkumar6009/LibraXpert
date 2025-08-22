// Mock MongoDB Implementation for LibraXpert
import { Book, Loan, Notification, Reservation, User } from '@/types';

// Mock database collections
const collections = {
  users: [] as User[],
  books: [] as Book[],
  loans: [] as Loan[],
  reservations: [] as Reservation[],
  notifications: [] as Notification[]
};

// MongoDB connection and operations
export const mongoDb = {
  // Connection status
  connected: false,

  // Connect to MongoDB (simulation)
  connect: async (): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate connection time
    mongoDb.connected = true;
    console.log('Connected to MongoDB');
    return true;
  },

  // Disconnect from MongoDB (simulation)
  disconnect: async (): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate disconnection time
    mongoDb.connected = false;
    console.log('Disconnected from MongoDB');
    return true;
  },

  // User operations
  users: {
    findByEmail: async (email: string): Promise<User | null> => {
      const user = collections.users.find(u => u.email === email);
      return user || null;
    },

    findByEnrollment: async (enrollmentNo: string): Promise<User | null> => {
      const user = collections.users.find(u => u.enrollmentNo === enrollmentNo);
      return user || null;
    },

    create: async (userData: Partial<User>): Promise<User> => {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name || 'New User',
        email: userData.email || `user${Date.now()}@example.com`,
        role: userData.role || 'external',
        profileImage: userData.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
        ...(userData.enrollmentNo && { enrollmentNo: userData.enrollmentNo }),
        ...(userData.department && { department: userData.department }),
        ...(userData.year && { year: userData.year })
      };
      collections.users.push(newUser);
      return newUser;
    },

    update: async (id: string, userData: Partial<User>): Promise<User | null> => {
      const index = collections.users.findIndex(u => u.id === id);
      if (index === -1) return null;

      const updatedUser = { ...collections.users[index], ...userData };
      collections.users[index] = updatedUser;
      return updatedUser;
    },

    delete: async (id: string): Promise<boolean> => {
      const index = collections.users.findIndex(u => u.id === id);
      if (index === -1) return false;
      
      collections.users.splice(index, 1);
      return true;
    },

    getAll: async (): Promise<User[]> => {
      return [...collections.users];
    }
  },

  // Book operations
  books: {
    
  },

  // Loan operations
  loans: {
    create: async (userId: string, bookId: string, processedBy?: string): Promise<Loan> => {
      const user = collections.users.find(u => u.id === userId);
      const book = collections.books.find(b => b.id === bookId);
      
      if (!user || !book) {
        throw new Error('User or book not found');
      }
      
      if (book.availableCopies <= 0) {
        throw new Error('No copies available for borrowing');
      }
      
      // Update book availability
      const bookIndex = collections.books.findIndex(b => b.id === bookId);
      collections.books[bookIndex] = {
        ...book,
        availableCopies: book.availableCopies - 1,
        status: book.availableCopies - 1 > 0 ? 'available' : 'borrowed'
      };
      
      // Create loan
      const newLoan: Loan = {
        id: `loan-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        bookId: book.id,
        bookTitle: book.title,
        borrowDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'active',
        ...(processedBy && { processedBy })
      };
      
      collections.loans.push(newLoan);
      
      // Create notification for due date
      const dueNotification: Notification = {
        id: `notif-${Date.now()}`,
        userId: user.id,
        title: 'Book due soon',
        message: `"${book.title}" is due in 14 days`,
        date: new Date(),
        isRead: false,
        type: 'due_date'
      };
      
      collections.notifications.push(dueNotification);
      
      return newLoan;
    },

    returnBook: async (loanId: string, processedBy?: string): Promise<Loan> => {
      const loanIndex = collections.loans.findIndex(l => l.id === loanId);
      
      if (loanIndex === -1) {
        throw new Error('Loan not found');
      }
      
      const loan = collections.loans[loanIndex];
      
      // Update book availability
      const bookIndex = collections.books.findIndex(b => b.id === loan.bookId);
      
      if (bookIndex !== -1) {
        const book = collections.books[bookIndex];
        collections.books[bookIndex] = {
          ...book,
          availableCopies: book.availableCopies + 1,
          status: 'available'
        };
      }
      
      // Update loan status
      const updatedLoan: Loan = {
        ...loan,
        returnDate: new Date(),
        status: 'returned',
        processedBy: processedBy || loan.processedBy
      };
      
      collections.loans[loanIndex] = updatedLoan;
      
      return updatedLoan;
    },

    getByUser: async (userId: string): Promise<Loan[]> => {
      return collections.loans.filter(l => l.userId === userId);
    },

    getAll: async (): Promise<Loan[]> => {
      return [...collections.loans];
    },

    getOverdue: async (): Promise<Loan[]> => {
      const now = new Date();
      return collections.loans.filter(l => 
        l.status === 'active' && l.dueDate < now
      );
    }
  },

  // Reservation operations
  reservations: {
    create: async (userId: string, bookId: string): Promise<Reservation> => {
      const user = collections.users.find(u => u.id === userId);
      const book = collections.books.find(b => b.id === bookId);
      
      if (!user || !book) {
        throw new Error('User or book not found');
      }
      
      const newReservation: Reservation = {
        id: `reservation-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        bookId: book.id,
        bookTitle: book.title,
        reservationDate: new Date(),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending'
      };
      
      collections.reservations.push(newReservation);
      
      // Create notification for reservation
      const reservationNotification: Notification = {
        id: `notif-${Date.now()}`,
        userId: user.id,
        title: 'Book reserved',
        message: `You have reserved "${book.title}". It will be held for 7 days.`,
        date: new Date(),
        isRead: false,
        type: 'reservation'
      };
      
      collections.notifications.push(reservationNotification);
      
      return newReservation;
    },

    fulfill: async (reservationId: string, approvedBy: string): Promise<Reservation> => {
      const reservationIndex = collections.reservations.findIndex(r => r.id === reservationId);
      
      if (reservationIndex === -1) {
        throw new Error('Reservation not found');
      }
      
      const reservation = collections.reservations[reservationIndex];
      
      // Update reservation status
      const updatedReservation: Reservation = {
        ...reservation,
        status: 'fulfilled',
        approvedBy
      };
      
      collections.reservations[reservationIndex] = updatedReservation;
      
      // Create notification for fulfilled reservation
      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: reservation.userId,
        title: 'Book reservation fulfilled',
        message: `Your reservation for "${reservation.bookTitle}" is ready for pickup.`,
        date: new Date(),
        isRead: false,
        type: 'reservation',
        actionLink: `/book/${reservation.bookId}`
      };
      
      collections.notifications.push(notif);
      
      return updatedReservation;
    },

    cancel: async (reservationId: string): Promise<Reservation> => {
      const reservationIndex = collections.reservations.findIndex(r => r.id === reservationId);
      
      if (reservationIndex === -1) {
        throw new Error('Reservation not found');
      }
      
      const reservation = collections.reservations[reservationIndex];
      
      // Update reservation status
      const updatedReservation: Reservation = {
        ...reservation,
        status: 'cancelled'
      };
      
      collections.reservations[reservationIndex] = updatedReservation;
      
      return updatedReservation;
    },

    getByUser: async (userId: string): Promise<Reservation[]> => {
      return collections.reservations.filter(r => r.userId === userId);
    },

    getByBook: async (bookId: string): Promise<Reservation[]> => {
      return collections.reservations.filter(r => r.bookId === bookId);
    },

    getAll: async (): Promise<Reservation[]> => {
      return [...collections.reservations];
    }
  },

  // Notification operations
  notifications: {
    getByUser: async (userId: string): Promise<Notification[]> => {
      return collections.notifications.filter(n => n.userId === userId);
    },

    markAsRead: async (notificationId: string): Promise<Notification | null> => {
      const notificationIndex = collections.notifications.findIndex(n => n.id === notificationId);
      
      if (notificationIndex === -1) return null;
      
      const updatedNotification = {
        ...collections.notifications[notificationIndex],
        isRead: true
      };
      
      collections.notifications[notificationIndex] = updatedNotification;
      return updatedNotification;
    },

    create: async (notification: Omit<Notification, 'id' | 'date' | 'isRead'>): Promise<Notification> => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        date: new Date(),
        isRead: false
      };
      
      collections.notifications.push(newNotification);
      return newNotification;
    },

    deleteAll: async (userId: string): Promise<boolean> => {
      const initialLength = collections.notifications.length;
      collections.notifications = collections.notifications.filter(n => n.userId !== userId);
      return collections.notifications.length < initialLength;
    }
  }
};

export default mongoDb;
