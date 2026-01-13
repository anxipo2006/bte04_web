import React, { useEffect, useState } from 'react';
import { getProductCodes, getArticles, deleteArticle, getQuestions, db } from '../services/firebase';
import { ProductCode, Article, Question } from '../types';
import Layout from '../components/Layout';
import { Users, FileText, QrCode, Trash2, Edit, MessageSquare, Plus, Database, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'codes' | 'content' | 'users'>('overview');
  const [codes, setCodes] = useState<ProductCode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [fetchedCodes, fetchedArticles] = await Promise.all([
      getProductCodes(),
      getArticles()
    ]);
    setCodes(fetchedCodes);
    setArticles(fetchedArticles);
    setLoading(false);
  };

  const handleDeleteArticle = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      await deleteArticle(id);
      loadData();
    }
  };

  // Hàm tự động tạo dữ liệu mẫu lên Firebase
  const handleSeedData = async () => {
    if (!confirm('Hành động này sẽ thêm dữ liệu mẫu (Mã sản phẩm & Bài viết) vào Database. Tiếp tục?')) return;
    setSeeding(true);
    try {
      const batch = writeBatch(db);

      // 1. Tạo mẫu 10 mã sản phẩm
      for (let i = 1; i <= 10; i++) {
        const codeString = `BTE04-TEST-${i.toString().padStart(3, '0')}`;
        const codeRef = doc(db, 'product_codes', codeString);
        batch.set(codeRef, {
          id: codeString,
          isUsed: false,
          createdAt: Date.now()
        });
      }

      // 2. Tạo 2 bài viết mẫu nếu chưa có
      if (articles.length === 0) {
        const art1Ref = doc(collection(db, 'articles'));
        batch.set(art1Ref, {
          id: art1Ref.id,
          title: 'Quy trình úm gà con hiệu quả cao cùng BTE04',
          category: 'technical',
          summary: 'Hướng dẫn chi tiết nhiệt độ, độ ẩm và cách sử dụng thức ăn BTE04 giai đoạn 1-21 ngày tuổi.',
          content: '<p>Nội dung chi tiết về quy trình úm gà...</p>',
          imageUrl: 'https://images.unsplash.com/photo-1542617307-e837f4177b4d?auto=format&fit=crop&q=80',
          author: 'Ban Kỹ Thuật',
          views: 120,
          date: new Date().toISOString().split('T')[0],
          tags: ['Gà', 'Kỹ thuật', 'Úm gà'],
          likes: [],
          comments: [],
          createdAt: Date.now()
        });
      }

      await batch.commit();
      alert('Đã khởi tạo dữ liệu thành công! Hãy reload lại trang.');
      loadData();
    } catch (error) {
      console.error(error);
      alert('Lỗi khởi tạo: ' + (error as any).message);
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
        
        <div className="flex gap-2">
           <button 
             onClick={handleSeedData}
             disabled={seeding}
             className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
           >
             {seeding ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
             Khởi tạo Data Mẫu
           </button>
           
           <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            {['overview', 'codes', 'content', 'users'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab ? 'bg-primary-100 text-primary-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab === 'overview' && 'Tổng quan'}
                {tab === 'codes' && 'Mã SP'}
                {tab === 'content' && 'Bài viết'}
                {tab === 'users' && 'User'}
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
            <h3 className="font-bold text-blue-900 mb-2">Hướng dẫn nhanh cho Admin mới</h3>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>Nếu Database trống, hãy nhấn nút <b>"Khởi tạo Data Mẫu"</b> ở góc trên bên phải.</li>
              <li>Hệ thống sẽ tạo ra 10 mã sản phẩm dùng thử (VD: <code>BTE04-TEST-001</code>).</li>
              <li>Bạn có thể dùng các mã này để đăng ký tài khoản thành viên mới ở trang Login.</li>
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
           {articles.length === 0 ? (
             <div className="p-8 text-center text-gray-500">Chưa có bài viết nào. Hãy thêm bài mới hoặc Khởi tạo data mẫu.</div>
           ) : (
             <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-600">Tiêu đề</th>
                  <th className="px-6 py-3 font-semibold text-gray-600 hidden md:table-cell">Danh mục</th>
                  <th className="px-6 py-3 font-semibold text-gray-600 hidden md:table-cell">Tương tác</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(art => (
                  <tr key={art.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">
                      <div className="truncate max-w-[200px] md:max-w-xs" title={art.title}>{art.title}</div>
                      <div className="md:hidden text-xs text-gray-400 mt-1">{art.category}</div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{art.category}</span></td>
                    <td className="px-6 py-4 text-gray-500 hidden md:table-cell">{art.views} xem • {art.likes.length} like</td>
                    <td className="px-6 py-4 flex space-x-2">
                      <button onClick={() => handleDeleteArticle(art.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
             </table>
           )}
        </div>
      )}

      {activeTab === 'codes' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Quản lý mã kích hoạt</h3>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Tổng: {codes.length}</span>
          </div>
          {codes.length === 0 ? (
             <div className="p-8 text-center text-gray-500">Chưa có mã sản phẩm nào. Hãy nhấn <b>"Khởi tạo Data Mẫu"</b>.</div>
           ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-gray-600">Mã BTE04</th>
                    <th className="px-6 py-3 font-semibold text-gray-600">Trạng thái</th>
                    <th className="px-6 py-3 font-semibold text-gray-600">Người dùng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {codes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono font-medium text-primary-700">{code.id}</td>
                      <td className="px-6 py-4">
                        {code.isUsed ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Đã dùng</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Chưa dùng</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{code.usedBy || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'users' && (
        <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed">
          Tính năng quản lý chi tiết User (Phân quyền Admin/Technical) đang phát triển.
          <br/>
          Hiện tại phân quyền dựa trên Email (admin@...) hoặc Mock Data.
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;