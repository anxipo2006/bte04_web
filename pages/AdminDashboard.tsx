import React, { useEffect, useState } from 'react';
import { getProductCodes, getArticles, deleteArticle, getQuestions, db, getAllUsers, updateUserChannels } from '../services/firebase';
import { ProductCode, Article, Question, UserProfile } from '../types';
import Layout from '../components/Layout';
import { Users, FileText, QrCode, Trash2, Edit, MessageSquare, Plus, Database, Loader2, UserCog, Check, X, Shield, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'codes' | 'content' | 'users'>('overview');
  const [codes, setCodes] = useState<ProductCode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [activeTab]); // Reload when switching tabs

  const loadData = async () => {
    const [fetchedCodes, fetchedArticles] = await Promise.all([
      getProductCodes(),
      getArticles()
    ]);
    setCodes(fetchedCodes);
    setArticles(fetchedArticles);

    if (activeTab === 'users') {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
    }

    setLoading(false);
  };

  const handleDeleteArticle = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      await deleteArticle(id);
      loadData();
    }
  };

  const handleUpdateChannels = async (uid: string, currentChannels: string[] = [], channelId: string) => {
      // Toggle channel
      const safeChannels = currentChannels || [];
      let newChannels = [];
      if (safeChannels.includes(channelId)) {
          newChannels = safeChannels.filter(c => c !== channelId);
      } else {
          newChannels = [...safeChannels, channelId];
      }
      
      try {
          // Optimistic update
          setUsers(prev => prev.map(u => u.uid === uid ? { ...u, allowedChannels: newChannels } : u));
          await updateUserChannels(uid, newChannels);
      } catch (error) {
          alert('Lỗi cập nhật quyền');
          loadData(); // revert
      }
  };

  // Helper to generate random code
  const generateRandomSuffix = (length: number) => {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let result = '';
      for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
  };

  const handleGenerateCodes = async () => {
    if (!confirm('Hành động này sẽ TẠO THÊM 10 mã kích hoạt ngẫu nhiên mới. Tiếp tục?')) return;
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      for (let i = 1; i <= 10; i++) {
        const suffix = generateRandomSuffix(6);
        const codeString = `BTE04-2024-${suffix}`;
        const codeRef = doc(db, 'product_codes', codeString);
        batch.set(codeRef, {
          id: codeString,
          isUsed: false,
          createdAt: Date.now()
        });
      }
      await batch.commit();
      alert('Đã tạo thành công 10 mã mới!');
      loadData();
      setActiveTab('codes');
    } catch (error) {
      console.error(error);
      alert('Lỗi: ' + (error as any).message);
    } finally {
      setSeeding(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`p-4 rounded-full ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <Layout userRole="admin">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Quản trị hệ thống</h1>
           <p className="text-sm text-gray-500">Xin chào Admin, quản lý toàn bộ hoạt động tại đây.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
           <button 
             onClick={handleGenerateCodes}
             disabled={seeding}
             className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-md"
           >
             {seeding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
             Tạo 10 Mã Mới
           </button>
           
           <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
            {['overview', 'codes', 'content', 'users'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab ? 'bg-primary-100 text-primary-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab === 'overview' && 'Tổng quan'}
                {tab === 'codes' && 'Mã SP'}
                {tab === 'content' && 'Bài viết'}
                {tab === 'users' && 'Thành viên & Chat'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Tổng mã phát hành" value={codes.length} icon={QrCode} color="bg-blue-500" />
            <StatCard title="Mã đã kích hoạt" value={codes.filter(c => c.isUsed).length} icon={Users} color="bg-green-500" />
            <StatCard title="Bài viết" value={articles.length} icon={FileText} color="bg-orange-500" />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-2">Hướng dẫn Admin</h3>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>Vào tab <b>Users</b> để cấp quyền vào nhóm chat Heo/Gà cho thành viên.</li>
              <li>Mã sản phẩm tạo ra để gửi cho khách in trên bao bì.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="p-4 border-b flex justify-between items-center">
             <h3 className="font-bold">Danh sách bài viết</h3>
             <button onClick={() => navigate('/create-article')} className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
               <Plus size={16} /> Thêm bài mới
             </button>
           </div>
           <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3">Tiêu đề</th>
                    <th className="px-6 py-3">Loại</th>
                    <th className="px-6 py-3">Người đăng</th>
                    <th className="px-6 py-3">Hành động</th>
                </tr>
            </thead>
            <tbody>
                {articles.map(art => (
                    <tr key={art.id} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4">{art.title}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs uppercase font-bold
                                ${art.type === 'market_sell' ? 'bg-red-100 text-red-700' : 
                                  art.type === 'market_buy' ? 'bg-blue-100 text-blue-700' :
                                  art.type === 'experience' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                            `}>
                                {art.type || 'Official'}
                            </span>
                        </td>
                        <td className="px-6 py-4">{art.author}</td>
                        <td className="px-6 py-4">
                            <button onClick={() => handleDeleteArticle(art.id)} className="text-red-500"><Trash2 size={18}/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
           </table>
        </div>
      )}

      {activeTab === 'codes' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Quản lý mã kích hoạt</h3>
          </div>
           <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3">Mã BTE04</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3">Người dùng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {codes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono font-bold text-primary-700">{code.id}</td>
                      <td className="px-6 py-4">{code.isUsed ? 'Đã dùng' : 'Chưa dùng'}</td>
                      <td className="px-6 py-4 text-xs">{code.usedBy || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}
      
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-6 border-b">
                <h3 className="font-bold text-gray-800 text-lg mb-1">Xét duyệt quyền truy cập Chat</h3>
                <p className="text-sm text-gray-500">Bấm vào các nút bên dưới để cấp quyền cho thành viên vào các nhóm kín.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="px-6 py-4">Thành viên</th>
                            <th className="px-6 py-4">Vai trò</th>
                            <th className="px-6 py-4 text-center">Hội Nuôi Heo</th>
                            <th className="px-6 py-4 text-center">Hội Nuôi Gà</th>
                            <th className="px-6 py-4 text-center">Chợ Giống</th>
                            <th className="px-6 py-4 text-center">Hỏi Kỹ Thuật</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-800">{u.displayName || 'Không tên'}</div>
                                    <div className="text-xs text-gray-500">{u.phoneNumber || u.uid.substring(0,8)}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                {/* Permissions Toggles */}
                                {[
                                    {id: 'pig', label: 'Heo', color: 'bg-pink-100 text-pink-700 border-pink-200'}, 
                                    {id: 'chicken', label: 'Gà', color: 'bg-yellow-100 text-yellow-700 border-yellow-200'}, 
                                    {id: 'market', label: 'Chợ', color: 'bg-green-100 text-green-700 border-green-200'},
                                    {id: 'technical', label: 'Kỹ Thuật', color: 'bg-blue-100 text-blue-700 border-blue-200'}
                                ].map(chan => {
                                    const hasAccess = u.allowedChannels?.includes(chan.id);
                                    return (
                                        <td key={chan.id} className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleUpdateChannels(u.uid, u.allowedChannels, chan.id)}
                                                className={`
                                                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                                                    ${hasAccess ? 'bg-primary-600' : 'bg-gray-200'}
                                                `}
                                            >
                                                <span
                                                    className={`
                                                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                                        ${hasAccess ? 'translate-x-6' : 'translate-x-1'}
                                                    `}
                                                />
                                            </button>
                                            <div className="text-[10px] mt-1 text-gray-400 font-medium">
                                                {hasAccess ? 'Đã cấp' : 'Chặn'}
                                            </div>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;