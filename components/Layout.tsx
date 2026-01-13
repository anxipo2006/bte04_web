import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../services/firebase';
import { Home, LogOut, Shield, Menu, X, HelpCircle, Gift, PenTool, UserCircle, MessageCircle } from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  const NavItem = ({ path, icon: Icon, label, highlight = false }: { path: string; icon: any; label: string; highlight?: boolean }) => {
    const isActive = location.pathname === path;
    return (
      <button
        onClick={() => {
          navigate(path);
          setIsMenuOpen(false);
        }}
        className={`flex items-center space-x-2 px-4 py-3 rounded-lg w-full transition-colors ${
          isActive 
            ? 'bg-primary-100 text-primary-900 font-semibold' 
            : highlight 
                ? 'bg-primary-50 text-primary-700 font-medium hover:bg-primary-100' 
                : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Icon size={20} />
        <span>{label}</span>
      </button>
    );
  };

  const isManagement = userRole === UserRole.ADMIN || userRole === UserRole.TECHNICAL;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-primary-700 text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="bg-white p-1 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.5s-6 3.5-6 10c0 4 5 9 6 9s6-5 6-9c0-6.5-6-10-6-10z"/><path d="M12 2.5v19"/></svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">BTE04</h1>
          </div>
          
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          <nav className="hidden md:flex items-center space-x-4">
             <button onClick={() => navigate('/dashboard')} className="hover:text-primary-100 font-medium flex items-center gap-1"><Home size={18}/> Trang chủ</button>
             <button onClick={() => navigate('/chat')} className="hover:text-primary-100 font-medium flex items-center gap-1"><MessageCircle size={18}/> Phòng Họp</button>
             <button onClick={() => navigate('/qa')} className="hover:text-primary-100 font-medium flex items-center gap-1"><HelpCircle size={18}/> Hỏi đáp</button>
             <button onClick={() => navigate('/spin')} className="hover:text-primary-100 font-medium flex items-center gap-1"><Gift size={18}/> Vòng quay</button>
             
             {isManagement && (
               <button 
                onClick={() => navigate('/create-article')} 
                className="bg-white text-primary-800 hover:bg-primary-50 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-sm transition-colors"
               >
                 <PenTool size={16}/> Đăng bài
               </button>
             )}
             
             {userRole === UserRole.ADMIN && (
               <button onClick={() => navigate('/admin')} className="hover:text-primary-100 font-medium flex items-center gap-1"><Shield size={18}/> Admin</button>
             )}

             <div className="h-6 w-px bg-primary-500 mx-2"></div>
             
             <button onClick={() => navigate('/profile')} className="hover:text-primary-100 font-medium flex items-center gap-1">
                <UserCircle size={20}/>
             </button>
             
             <button onClick={handleLogout} className="text-sm opacity-80 hover:opacity-100 hover:underline">
               Thoát
             </button>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-lg text-primary-900">Menu</span>
                <button onClick={() => setIsMenuOpen(false)}><X size={24} /></button>
             </div>
             
             <div className="flex-1 space-y-2">
               {isManagement && (
                 <NavItem path="/create-article" icon={PenTool} label="Đăng bài viết mới" highlight={true} />
               )}

               <NavItem path="/dashboard" icon={Home} label="Tin tức & Kỹ thuật" />
               <NavItem path="/chat" icon={MessageCircle} label="Phòng Họp Cộng Đồng" />
               <NavItem path="/qa" icon={HelpCircle} label="Hỏi đáp chuyên gia" />
               <NavItem path="/spin" icon={Gift} label="Vòng quay may mắn" />
               <NavItem path="/profile" icon={UserCircle} label="Thông tin tài khoản" />

               {userRole === UserRole.ADMIN && (
                 <NavItem path="/admin" icon={Shield} label="Quản trị hệ thống" />
               )}
             </div>

             <div className="pt-4 border-t border-gray-200">
               <button onClick={handleLogout} className="flex items-center space-x-2 text-red-600 px-4 py-3 w-full hover:bg-red-50 rounded-lg">
                 <LogOut size={20} />
                 <span>Đăng xuất</span>
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary-900 text-primary-100 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="font-bold text-lg mb-2">CỘNG ĐỒNG CHĂN NUÔI BTE04</p>
          <div className="flex justify-center space-x-4 mb-4 text-sm">
            <span>Admin: Toàn quyền</span>
            <span>•</span>
            <span>Kỹ thuật: Hỗ trợ chuyên môn</span>
            <span>•</span>
            <span>Thành viên: Kết nối</span>
          </div>
          <div className="text-xs text-gray-400">
            &copy; 2024 BTE04. Độc quyền cho thành viên.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;