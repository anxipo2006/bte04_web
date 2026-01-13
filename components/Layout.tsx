import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../services/firebase';
import { Home, LogOut, Shield, Menu, X, HelpCircle, Gift, PenTool, UserCircle, MessageCircle, Info } from 'lucide-react';
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
        className={`flex items-center space-x-2 px-4 py-3 rounded-lg w-full transition-colors font-medium ${
          isActive 
            ? 'bg-primary-100 text-primary-900 font-bold shadow-sm' 
            : highlight 
                ? 'bg-primary-700 text-white hover:bg-primary-800 shadow-md' 
                : 'text-slate-700 hover:bg-gray-100 hover:text-slate-900'
        }`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
      </button>
    );
  };

  const isManagement = userRole === UserRole.ADMIN || userRole === UserRole.TECHNICAL;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Bar */}
      <header className="bg-primary-800 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="bg-white p-1.5 rounded-full shadow-sm">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.5s-6 3.5-6 10c0 4 5 9 6 9s6-5 6-9c0-6.5-6-10-6-10z"/><path d="M12 2.5v19"/></svg>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">BTE04</h1>
          </div>
          
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          <nav className="hidden md:flex items-center space-x-1 lg:space-x-4">
             <button onClick={() => navigate('/dashboard')} className="px-3 py-2 rounded-md hover:bg-primary-700 hover:text-white font-semibold flex items-center gap-1.5 transition-colors"><Home size={18}/> Trang chủ</button>
             <button onClick={() => navigate('/about')} className="px-3 py-2 rounded-md hover:bg-primary-700 hover:text-white font-semibold flex items-center gap-1.5 transition-colors"><Info size={18}/> Giới thiệu</button>
             <button onClick={() => navigate('/chat')} className="px-3 py-2 rounded-md hover:bg-primary-700 hover:text-white font-semibold flex items-center gap-1.5 transition-colors"><MessageCircle size={18}/> Phòng Họp</button>
             <button onClick={() => navigate('/qa')} className="px-3 py-2 rounded-md hover:bg-primary-700 hover:text-white font-semibold flex items-center gap-1.5 transition-colors"><HelpCircle size={18}/> Hỏi đáp</button>
             <button onClick={() => navigate('/spin')} className="px-3 py-2 rounded-md hover:bg-primary-700 hover:text-white font-semibold flex items-center gap-1.5 transition-colors"><Gift size={18}/> Vòng quay</button>
             
             {isManagement && (
               <button 
                onClick={() => navigate('/create-article')} 
                className="bg-white text-primary-800 hover:bg-primary-50 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-colors ml-2"
               >
                 <PenTool size={16}/> Đăng bài
               </button>
             )}
             
             {userRole === UserRole.ADMIN && (
               <button onClick={() => navigate('/admin')} className="px-3 py-2 rounded-md hover:bg-primary-700 hover:text-white font-semibold flex items-center gap-1.5 transition-colors text-yellow-300"><Shield size={18}/> Admin</button>
             )}

             <div className="h-6 w-px bg-primary-600 mx-2"></div>
             
             <button onClick={() => navigate('/profile')} className="p-2 rounded-full hover:bg-primary-700 transition-colors" title="Thông tin cá nhân">
                <UserCircle size={24}/>
             </button>
             
             <button onClick={handleLogout} className="text-sm font-medium opacity-90 hover:opacity-100 hover:underline">
               Thoát
             </button>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-60 md:hidden backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6 border-b pb-4">
                <span className="font-extrabold text-xl text-primary-900">Menu</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-gray-500 hover:text-red-500"><X size={24} /></button>
             </div>
             
             <div className="flex-1 space-y-2 overflow-y-auto">
               {isManagement && (
                 <NavItem path="/create-article" icon={PenTool} label="Đăng bài viết mới" highlight={true} />
               )}

               <NavItem path="/dashboard" icon={Home} label="Tin tức & Kỹ thuật" />
               <NavItem path="/about" icon={Info} label="Về BTE04" />
               <NavItem path="/chat" icon={MessageCircle} label="Phòng Họp Cộng Đồng" />
               <NavItem path="/qa" icon={HelpCircle} label="Hỏi đáp chuyên gia" />
               <NavItem path="/spin" icon={Gift} label="Vòng quay may mắn" />
               <NavItem path="/profile" icon={UserCircle} label="Thông tin tài khoản" />

               {userRole === UserRole.ADMIN && (
                 <NavItem path="/admin" icon={Shield} label="Quản trị hệ thống" />
               )}
             </div>

             <div className="pt-4 border-t border-gray-200 mt-2">
               <button onClick={handleLogout} className="flex items-center space-x-2 text-red-600 px-4 py-3 w-full hover:bg-red-50 rounded-lg font-bold transition-colors">
                 <LogOut size={20} />
                 <span>Đăng xuất</span>
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-200 py-10 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
             <div className="bg-white p-1 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.5s-6 3.5-6 10c0 4 5 9 6 9s6-5 6-9c0-6.5-6-10-6-10z"/><path d="M12 2.5v19"/></svg>
            </div>
            <span className="font-bold text-2xl tracking-wide">BTE04</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-8 text-sm font-medium">
            <button onClick={() => navigate('/about')} className="hover:text-white hover:underline transition-all">Về chúng tôi</button>
            <button onClick={() => navigate('/qa')} className="hover:text-white hover:underline transition-all">Hỗ trợ kỹ thuật</button>
            <button onClick={() => navigate('/privacy')} className="hover:text-white hover:underline transition-all">Chính sách bảo mật</button>
            <button onClick={() => navigate('/contact')} className="hover:text-white hover:underline transition-all">Liên hệ</button>
          </div>
          <div className="text-xs text-slate-500 border-t border-slate-800 pt-6">
            &copy; 2024 CÔNG TY TNHH BTE04. Nền tảng độc quyền cho thành viên.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;