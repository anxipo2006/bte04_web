import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { subscribeToChat, sendChatMessage, auth, getUserProfile, getAllUsers, updateUserChannels } from '../services/firebase';
import { ChatMessage, ChatChannel, UserRole, UserProfile } from '../types';
import { Send, Hash, MessageCircle, Shield, CheckCircle, Users, Menu, X, Lock, Key, Loader2, UserPlus, Search, Check, Plus } from 'lucide-react';

const CHANNELS: ChatChannel[] = [
  { id: 'general', name: 'Sảnh Chung', description: 'Giao lưu, chém gió tổng hợp', icon: 'MessagesSquare', isRestricted: false },
  { id: 'pig', name: 'Hội Nuôi Heo', description: 'Chuyên sâu kỹ thuật Heo', icon: 'PiggyBank', isRestricted: true },
  { id: 'chicken', name: 'Hội Nuôi Gà', description: 'Chuyên sâu kỹ thuật Gà', icon: 'Egg', isRestricted: true },
  { id: 'technical', name: 'Hỏi Kỹ Thuật', description: 'Hỗ trợ khẩn cấp từ BTE04', icon: 'Stethoscope', isRestricted: true },
  { id: 'market', name: 'Chợ Giống & Cám', description: 'Thông tin mua bán kín', icon: 'Store', isRestricted: true },
];

const CommunityChat: React.FC = () => {
  const [currentChannel, setCurrentChannel] = useState<ChatChannel>(CHANNELS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State quản lý quyền hạn
  const [allowedChannels, setAllowedChannels] = useState<string[]>(['general']);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER); // Quan trọng: Dùng state thay vì const
  const [isLoadingPerms, setIsLoadingPerms] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // State quản lý thành viên (Admin only)
  const [showManageModal, setShowManageModal] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [managingLoading, setManagingLoading] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.currentUser || JSON.parse(localStorage.getItem('bte04_demo_user') || 'null');

  // Load User Permissions & Role
  useEffect(() => {
    const fetchPerms = async () => {
        if (currentUser) {
            let role = UserRole.USER;
            let channels = ['general'];

            // 1. Xác định Role (Ưu tiên check Email Admin trước cho nhanh)
            if (currentUser.email?.startsWith('admin') || currentUser.email?.includes('admin')) {
                role = UserRole.ADMIN;
            } else if (currentUser.role) {
                // Trường hợp Demo User (Local Storage) có sẵn role
                role = currentUser.role;
            } else {
                // Trường hợp User thường, lấy từ DB để chắc chắn
                const profile = await getUserProfile(currentUser.uid);
                if (profile && profile.role) {
                    role = profile.role;
                }
            }
            
            setUserRole(role || UserRole.USER);

            // 2. Xác định Channels được phép vào
            if (role === UserRole.ADMIN) {
                // Nếu là Admin => Full quyền
                channels = CHANNELS.map(c => c.id);
            } else if (currentUser.allowedChannels) {
                // Lấy từ Local Storage (nếu có)
                channels = currentUser.allowedChannels;
            } else {
                // Lấy từ DB
                const profile = await getUserProfile(currentUser.uid);
                if (profile && profile.allowedChannels) {
                    channels = profile.allowedChannels;
                }
            }
            setAllowedChannels(channels);
        }
        setIsLoadingPerms(false);
    };
    fetchPerms();
  }, [currentUser]);

  const isAccessAllowed = (channelId: string) => {
      // Logic kiểm tra quyền:
      // 1. Kênh không bị khóa (Sảnh chung) -> Luôn mở
      const channel = CHANNELS.find(c => c.id === channelId);
      if (channel && !channel.isRestricted) return true;

      // 2. Là Admin -> Luôn mở
      if (userRole === UserRole.ADMIN) return true;
      
      // 3. Có trong danh sách được cấp phép
      return allowedChannels.includes(channelId);
  };

  // Subscribe to real-time updates (only if allowed)
  useEffect(() => {
    setMessages([]); // Clear previous messages immediately
    
    // Chỉ load khi đã xác định xong quyền
    if (isLoadingPerms) return;

    if (!isAccessAllowed(currentChannel.id)) {
        setIsChatLoading(false);
        return;
    }

    setIsChatLoading(true); // Show loader
    const unsubscribe = subscribeToChat(currentChannel.id, (msgs) => {
      setMessages(msgs);
      setIsChatLoading(false); // Hide loader once data arrives
    });
    return () => unsubscribe();
  }, [currentChannel, allowedChannels, isLoadingPerms, userRole]);

  // Auto scroll to bottom
  useEffect(() => {
    if (!isChatLoading) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const text = inputText;
    setInputText(''); 

    await sendChatMessage({
      text: text,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Thành viên',
      userRole: userRole || UserRole.USER,
      channelId: currentChannel.id
    });
  };

  // --- ADMIN MANAGEMENT LOGIC ---
  const handleOpenManageModal = async () => {
      setShowManageModal(true);
      setManagingLoading(true);
      try {
          const users = await getAllUsers();
          setAllUsers(users);
      } catch (error) {
          console.error("Error fetching users", error);
      } finally {
          setManagingLoading(false);
      }
  };

  const handleToggleMemberAccess = async (user: UserProfile) => {
      const currentChannels = user.allowedChannels || [];
      const isMember = currentChannels.includes(currentChannel.id);
      let newChannels;
      
      if (isMember) {
          newChannels = currentChannels.filter(c => c !== currentChannel.id);
      } else {
          newChannels = [...currentChannels, currentChannel.id];
      }
      
      // Optimistic Update
      setAllUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, allowedChannels: newChannels } : u));
      
      try {
          await updateUserChannels(user.uid, newChannels);
      } catch (error) {
          alert('Lỗi cập nhật quyền');
          // Revert logic would go here
      }
  };

  const filteredUsers = allUsers.filter(u => 
      (u.displayName?.toLowerCase() || '').includes(memberSearchTerm.toLowerCase()) ||
      (u.phoneNumber?.includes(memberSearchTerm)) || 
      (u.email?.includes(memberSearchTerm))
  );

  const getRoleBadge = (role: UserRole) => {
    if (role === UserRole.ADMIN) return <Shield size={14} className="text-red-500 fill-red-100" />;
    if (role === UserRole.TECHNICAL) return <CheckCircle size={14} className="text-blue-500 fill-blue-100" />;
    return null;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout userRole={userRole}>
      <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative">
        
        {/* Mobile Toggle Sidebar */}
        <button 
            className="md:hidden absolute top-4 left-4 z-20 bg-white p-2 rounded-lg shadow-md border"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
            {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>

        {/* Channels Sidebar */}
        <div className={`
            absolute md:relative z-10 w-64 bg-gray-50 border-r h-full flex flex-col transition-transform duration-300
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4 border-b bg-primary-800 text-white">
            <h2 className="font-bold flex items-center gap-2">
              <MessageCircle size={20} /> BTE04 Chat
            </h2>
            <p className="text-xs text-primary-200 mt-1">Cộng đồng trực tuyến</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {CHANNELS.map(channel => {
              const locked = !isAccessAllowed(channel.id);
              const isActive = currentChannel.id === channel.id;
              return (
                <button
                    key={channel.id}
                    onClick={() => {
                        if (!isActive) {
                            setCurrentChannel(channel);
                            setIsSidebarOpen(false);
                        }
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all relative ${
                    isActive
                        ? 'bg-white shadow-sm border border-gray-200 text-primary-700 font-bold' 
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                >
                    <div className={`p-2 rounded-md relative ${isActive ? 'bg-primary-100' : 'bg-gray-200'}`}>
                        <Hash size={16} />
                        {locked && (
                            <div className="absolute -top-1 -right-1 bg-gray-500 rounded-full p-0.5 border-2 border-white">
                                <Lock size={10} className="text-white"/>
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-sm flex items-center gap-1">
                            {channel.name}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate w-32">{channel.description}</div>
                    </div>
                </button>
              );
            })}
          </div>
          
          <div className="p-4 border-t bg-gray-100">
             <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Users size={14} /> 
                <span>Trực tuyến: Nhiều</span>
             </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col w-full relative bg-gray-50/50">
          {/* Header */}
          <div className="h-16 border-b flex items-center px-6 md:px-6 pl-16 bg-white justify-between shadow-sm z-10">
            <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Hash size={18} className="text-gray-400" />
                    {currentChannel.name}
                    {!isAccessAllowed(currentChannel.id) && <Lock size={16} className="text-red-500"/>}
                </h3>
                <p className="text-xs text-gray-500 hidden md:block">{currentChannel.description}</p>
            </div>
            
            <div className="flex items-center gap-2">
                {currentChannel.id === 'technical' && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold animate-pulse mr-2">
                        Hỗ trợ trực tiếp
                    </span>
                )}
                
                {/* Admin Add Member Button */}
                {userRole === UserRole.ADMIN && (
                    <button 
                        onClick={handleOpenManageModal}
                        className="p-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg flex items-center gap-2 transition-colors border border-primary-100"
                        title="Quản lý thành viên nhóm này"
                    >
                        <UserPlus size={18} />
                        <span className="text-sm font-bold hidden md:inline">Thành viên</span>
                    </button>
                )}
            </div>
          </div>

          {/* Access Control Overlay */}
          {!isAccessAllowed(currentChannel.id) ? (
              <div className="absolute inset-0 top-16 bg-gray-50/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
                  <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-gray-200">
                      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Lock size={32} className="text-gray-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Nhóm Chat Hạn Chế</h3>
                      <p className="text-gray-600 mb-6">
                          Nhóm <b>{currentChannel.name}</b> dành riêng cho các thành viên được xét duyệt. 
                          Để tham gia, vui lòng liên hệ Admin hoặc Kỹ thuật viên để được thêm vào nhóm.
                      </p>
                      <button 
                        onClick={() => setCurrentChannel(CHANNELS[0])}
                        className="text-primary-600 font-bold hover:underline"
                      >
                          Quay lại Sảnh Chung
                      </button>
                  </div>
              </div>
          ) : (
            <>
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                    {isChatLoading ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-primary-500" size={48} />
                            <p className="mt-4 text-gray-500 text-sm">Đang tải cuộc trò chuyện...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <MessageCircle size={64} strokeWidth={1} />
                            <p className="mt-2">Chưa có tin nhắn nào. Hãy bắt đầu!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                        const isMe = msg.userId === currentUser.uid;
                        const showHeader = index === 0 || messages[index - 1].userId !== msg.userId;
                        const isAdminOrTech = msg.userRole === UserRole.ADMIN || msg.userRole === UserRole.TECHNICAL;

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            {showHeader && (
                                <div className={`flex items-center gap-1 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span className={`text-xs font-bold ${isAdminOrTech ? 'text-primary-700' : 'text-gray-600'}`}>
                                    {msg.userName}
                                </span>
                                {getRoleBadge(msg.userRole)}
                                <span className="text-[10px] text-gray-400 ml-2">{formatTime(msg.createdAt)}</span>
                                </div>
                            )}
                            <div 
                                className={`
                                px-4 py-2 rounded-2xl max-w-[85%] md:max-w-[70%] text-sm shadow-sm break-words border
                                ${isMe 
                                    ? 'bg-primary-50 border-primary-100 text-gray-900 rounded-tr-none' // Black Text for ME
                                    : 'bg-white border-gray-100 text-gray-900 rounded-tl-none' // Black Text for OTHERS
                                }
                                ${isAdminOrTech && !isMe ? 'border-primary-200 bg-primary-50/50' : ''}
                                `}
                            >
                                {msg.text}
                            </div>
                            </div>
                        );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t">
                    <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Nhập tin nhắn vào #${currentChannel.name}...`}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-gray-900"
                    />
                    <button 
                        type="submit" 
                        disabled={!inputText.trim()}
                        className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <Send size={20} />
                    </button>
                    </form>
                </div>
            </>
          )}
        </div>
      </div>

      {/* ADMIN MANAGE MODAL */}
      {showManageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col max-h-[80vh] shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b flex justify-between items-center bg-primary-50 rounded-t-2xl">
                      <div>
                        <h3 className="font-bold text-lg text-primary-900">Quản lý thành viên</h3>
                        <p className="text-xs text-primary-700">Kênh: <b>{currentChannel.name}</b></p>
                      </div>
                      <button onClick={() => setShowManageModal(false)} className="text-gray-500 hover:text-red-500"><X size={24}/></button>
                  </div>
                  
                  <div className="p-4 border-b">
                     <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm tên, SĐT hoặc Email..." 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                            value={memberSearchTerm}
                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                        />
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                      {managingLoading ? (
                          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-500"/></div>
                      ) : (
                          <div className="space-y-1">
                              {filteredUsers.length === 0 ? (
                                  <p className="text-center text-gray-400 py-4 text-sm">Không tìm thấy thành viên nào.</p>
                              ) : filteredUsers.map(user => {
                                  const hasAccess = user.allowedChannels?.includes(currentChannel.id);
                                  const isAdmin = user.role === UserRole.ADMIN;
                                  return (
                                      <div key={user.uid} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group border border-transparent hover:border-gray-100 transition-all">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                                                  {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                                              </div>
                                              <div>
                                                  <p className="font-bold text-sm text-gray-800">{user.displayName || 'Không tên'}</p>
                                                  <p className="text-xs text-gray-500">{user.phoneNumber || user.email}</p>
                                              </div>
                                          </div>
                                          
                                          {isAdmin ? (
                                              <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Admin</span>
                                          ) : (
                                              <button 
                                                onClick={() => handleToggleMemberAccess(user)}
                                                className={`
                                                    px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all
                                                    ${hasAccess 
                                                        ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' 
                                                        : 'bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-700'
                                                    }
                                                `}
                                              >
                                                  {hasAccess ? <><Check size={12}/> Đã tham gia</> : <><Plus size={12}/> Thêm vào</>}
                                              </button>
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </Layout>
  );
};

export default CommunityChat;