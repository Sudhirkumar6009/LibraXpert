
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookCheck, BookX, Calendar, Bell } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  
  // Mock data
  const currentLoans = [
    {
      id: '1',
      title: 'Clean Code: A Handbook of Agile Software',
      author: 'Robert C. Martin',
      dueDate: new Date('2025-05-05'),
      coverImage: 'https://m.media-amazon.com/images/I/51E2055ZGUL._SY445_SX342_.jpg'
    },
    {
      id: '2',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Erich Gamma et al.',
      dueDate: new Date('2025-05-10'),
      coverImage: 'https://m.media-amazon.com/images/I/51szD9HC9pL._SY445_SX342_.jpg'
    }
  ];

  const reservations = [
    {
      id: '1',
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt & David Thomas',
      availableDate: new Date('2025-04-25'),
      coverImage: 'https://m.media-amazon.com/images/I/51W1sBPO7tL._SY445_SX342_.jpg'
    }
  ];

  const notifications = [
    {
      id: '1',
      title: 'Book Due Soon',
      message: '"Design Patterns" is due in 5 days',
      date: new Date('2025-04-15'),
      type: 'due_date'
    },
    {
      id: '2',
      title: 'Reservation Available',
      message: '"The Pragmatic Programmer" is ready for pickup',
      date: new Date('2025-04-18'),
      type: 'reservation'
    },
    {
      id: '3',
      title: 'New Feature Added',
      message: 'Try our new book recommendation system based on your reading history',
      date: new Date('2025-04-10'),
      type: 'system'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex">
        <Sidebar className="hidden lg:block" />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome, {user?.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1 md:mt-0">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Current Loans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-bold">{currentLoans.length}</div>
                    <div className="p-2 bg-blue-50 rounded-full">
                      <BookCheck className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Reservations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-bold">{reservations.length}</div>
                    <div className="p-2 bg-yellow-50 rounded-full">
                      <Calendar className="h-5 w-5 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Overdue Books</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-bold">0</div>
                    <div className="p-2 bg-red-50 rounded-full">
                      <BookX className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Current Loans */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>Current Loans</CardTitle>
                      <Button variant="ghost" size="sm">
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {currentLoans.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        No current loans
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentLoans.map((book) => (
                          <div key={book.id} className="flex items-center space-x-4">
                            <div className="flex-shrink-0 h-16 w-12 overflow-hidden rounded">
                              <img 
                                src={book.coverImage} 
                                alt={book.title} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {book.title}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {book.author}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-gray-500">Due Date</span>
                              <span className="text-sm font-medium">
                                {book.dueDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Reservations */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>Reservations</CardTitle>
                      <Button variant="ghost" size="sm">
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {reservations.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        No reservations
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reservations.map((book) => (
                          <div key={book.id} className="flex items-center space-x-4">
                            <div className="flex-shrink-0 h-16 w-12 overflow-hidden rounded">
                              <img 
                                src={book.coverImage} 
                                alt={book.title} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {book.title}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {book.author}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-gray-500">Available</span>
                              <span className="text-sm font-medium text-green-600">
                                {book.availableDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Notifications */}
              <Card className="lg:row-span-2">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Notifications</CardTitle>
                    <Button variant="ghost" size="sm">
                      Mark All Read
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex space-x-3">
                        <div className="flex-shrink-0">
                          {notification.type === 'due_date' && (
                            <div className="p-1 bg-yellow-100 rounded-full">
                              <Calendar className="h-4 w-4 text-yellow-500" />
                            </div>
                          )}
                          {notification.type === 'reservation' && (
                            <div className="p-1 bg-green-100 rounded-full">
                              <BookCheck className="h-4 w-4 text-green-500" />
                            </div>
                          )}
                          {notification.type === 'system' && (
                            <div className="p-1 bg-blue-100 rounded-full">
                              <Bell className="h-4 w-4 text-blue-500" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
