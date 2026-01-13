import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { subscribeToChat, sendChatMessage, auth } from '../services/firebase';
import { ChatMessage, ChatChannel, UserRole } from '../types';
import { Send, Hash, MessageCircle, Shield, CheckCircle, Users, Menu, X } from 'lucide-react';

const CHANNELS: ChatChannel[] = [
  { id: 'general', name: 'Sảnh Chung', description: 'Giao lưu, chém gió tổng hợp', icon: 'MessagesSquare' },
  { id: 'pig', name: 'Hội Nuôi Heo', description: 'Kỹ thuật & Giá cả Heo', icon: 'PiggyBank' },
  { id: 'chicken', name: 'Hội Nuôi Gà', description: 'Kỹ thuật & Giá cả Gà', icon: 'Egg' },
  { id: 'technical', name: 'Hỏi Kỹ Thuật', description: 'Hỗ trợ khẩn cấp từ BTE04', icon: 'Stethoscope' },
  { id: 'market', name: 'Chợ Giống & Cám', description: 'Thông tin mua bán', icon: 'Store' },
];

const CommunityChat: React.FC = () => {
  const [currentChannel, setCurrentChannel] = useState<ChatChannel>(CHANNELS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.currentUser || JSON.parse(localStorage.getItem('bte04_demo_user') || 'null');
  const userRole = currentUser?.role || UserRole.USER;

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToChat(currentChannel.id, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [currentChannel]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const text = inputText;
    setInputText(''); // Optimistic clear

    await sendChatMessage({
      text: text,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Thành viên',
      userRole: userRole,
      channelId: currentChannel.id
    });
  };

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
            {CHANNELS.map(channel => (
              <button
                key={channel.id}
                onClick={() => {
                  setCurrentChannel(channel);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                  currentChannel.id === channel.id 
                    ? 'bg-white shadow-sm border border-gray-200 text-primary-700 font-bold' 
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <div className={`p-2 rounded-md ${currentChannel.id === channel.id ? 'bg-primary-100' : 'bg-gray-200'}`}>
                    <Hash size={16} />
                </div>
                <div>
                  <div className="text-sm">{channel.name}</div>
                  <div className="text-[10px] text-gray-400 truncate w-32">{channel.description}</div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-4 border-t bg-gray-100">
             <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Users size={14} /> 
                <span>Đang trực tuyến: Nhiều</span>
             </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col w-full">
          {/* Header */}
          <div className="h-16 border-b flex items-center px-6 md:px-6 pl-16 bg-white justify-between">
            <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Hash size={18} className="text-gray-400" />
                    {currentChannel.name}
                </h3>
                <p className="text-xs text-gray-500 hidden md:block">{currentChannel.description}</p>
            </div>
            {currentChannel.id === 'technical' && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                    Hỗ trợ trực tiếp
                </span>
            )}
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth">
            {messages.length === 0 ? (
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
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
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
                          px-4 py-2 rounded-2xl max-w-[85%] md:max-w-[70%] text-sm shadow-sm break-words
                          ${isMe 
                            ? 'bg-primary-600 text-white rounded-tr-none' 
                            : isAdminOrTech 
                                ? 'bg-white border-2 border-primary-100 text-gray-800 rounded-tl-none' 
                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                          }
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
                className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
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
        </div>
      </div>
    </Layout>
  );
};

export default CommunityChat;