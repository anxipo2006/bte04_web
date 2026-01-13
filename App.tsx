import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserRole, DEMO_USER_KEY } from './services/firebase';
import { UserRole } from './types';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import NewsFeed from './pages/NewsFeed';
import ArticleDetail from './pages/ArticleDetail';
import AdminDashboard from './pages/AdminDashboard';
import QAForum from './pages/QAForum';
import LuckySpin from './pages/LuckySpin';
import CreateArticle from './pages/CreateArticle';
import Profile from './pages/Profile';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>(UserRole.USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Helper to check local storage for demo user
    const checkLocalUser = () => {
      const demoUserJson = localStorage.getItem(DEMO_USER_KEY);
      if (demoUserJson) {
        try {
          const demoUser = JSON.parse(demoUserJson);
          setUser(demoUser);
          setRole(demoUser.role || UserRole.USER);
        } catch (e) {
          setUser(null);
        }
      } else {
        if (!auth.currentUser) {
          setUser(null);
          setRole(UserRole.USER);
        }
      }
    };

    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.email?.startsWith('admin')) {
          setRole(UserRole.ADMIN);
        } else {
          // In a real app we check Firestore, for demo we can mock a check
          const dbRole = await getUserRole(currentUser.uid);
          // Temporary hack to simulate Technical role if email starts with tech
          if (currentUser.email?.startsWith('tech')) setRole(UserRole.TECHNICAL);
          else setRole(dbRole);
        }
      } else {
        checkLocalUser();
      }
      setLoading(false);
    });

    window.addEventListener('auth-change', checkLocalUser);

    return () => {
      unsubscribe();
      window.removeEventListener('auth-change', checkLocalUser);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth />} />

        {/* Private Routes (All Members) */}
        <Route 
          path="/dashboard" 
          element={user ? <NewsFeed /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/article/:id" 
          element={user ? <ArticleDetail /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/qa" 
          element={user ? <QAForum /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/spin" 
          element={user ? <LuckySpin /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Profile /> : <Navigate to="/auth" />} 
        />

        {/* Management Routes (Admin & Technical) */}
        <Route 
          path="/create-article" 
          element={user && (role === UserRole.ADMIN || role === UserRole.TECHNICAL) ? <CreateArticle /> : <Navigate to="/dashboard" />} 
        />

        {/* Admin Route */}
        <Route 
          path="/admin" 
          element={user && role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/dashboard" />} 
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;