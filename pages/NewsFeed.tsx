import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getArticles, auth, getUserRole, createArticle } from '../services/firebase';
import { Article, UserRole, ArticleType } from '../types';
import { Search, Calendar, Eye, PenTool, ShoppingBag, MessageSquare, MapPin, Phone, Upload, X, Image as ImageIcon } from 'lucide-react';
import Layout from '../components/Layout';

const NewsFeed: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'official' | 'experience' | 'market'>('official');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(UserRole.USER);
  const [showPostModal, setShowPostModal] = useState(false);
  const navigate = useNavigate();

  // New Post Form State
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postType, setPostType] = useState<ArticleType>('experience');
  const [postPrice, setPostPrice] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [postPhone, setPostPhone] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const fetchedArticles = await getArticles();
      setArticles(fetchedArticles);
      
      const user = auth.currentUser || JSON.parse(localStorage.getItem('bte04_demo_user') || 'null');
      if (user) {
         if (user.role) setCurrentUserRole(user.role);
         else {
             const role = await getUserRole(user.uid);
             setCurrentUserRole(role);
         }
         if (user.email?.startsWith('admin')) setCurrentUserRole(UserRole.ADMIN);
         
         // Auto-fill phone if available
         if (user.phoneNumber) setPostPhone(user.phoneNumber);
      }
      setLoading(false);
    };

    init();
  }, [showPostModal]); // Reload when modal closes (after post)

  // Filter Logic
  const filteredArticles = articles.filter(art => {
    // 1. Tab Filter
    let matchesTab = false;
    if (activeTab === 'official') {
        matchesTab = (!art.type || art.type === 'official');
    } else if (activeTab === 'experience') {
        matchesTab = art.type === 'experience';
    } else if (activeTab === 'market') {
        matchesTab = art.type === 'market_sell' || art.type === 'market_buy';
    }

    // 2. Search Filter
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          art.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Ảnh tối đa 5MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
        setPostImage(readerEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      const user = auth.currentUser || JSON.parse(localStorage.getItem('bte04_demo_user') || 'null');
      
      try {
        await createArticle({
            title: postTitle || (postType === 'experience' ? 'Chia sẻ từ thành viên' : 'Tin rao vặt'),
            category: postType === 'experience' ? 'experience' : 'market',
            type: postType,
            summary: postContent.substring(0, 100) + '...',
            content: `<p>${postContent.replace(/\n/g, '<br/>')}</p>`,
            imageUrl: postImage || 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80',
            author: user.displayName || 'Thành viên BTE04',
            authorId: user.uid,
            authorRole: currentUserRole,
            price: postPrice ? parseFloat(postPrice.replace(/\D/g,'')) : undefined,
            location: postLocation,
            contactPhone: postPhone,
            tags: [],
            status: 'approved' 
        });
        
        // Reset form
        setPostTitle('');
        setPostContent('');
        setPostImage('');
        setPostPrice('');
        setPostLocation('');
        setShowPostModal(false);
        setActiveTab(postType === 'experience' ? 'experience' : 'market');
      } catch (error) {
          alert('Lỗi đăng bài');
      } finally {
          setSubmitting(false);
      }
  };

  const canCreateOfficial = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.TECHNICAL;

  const TabButton = ({ id, label, icon: Icon }: any) => (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            activeTab === id 
            ? 'bg-primary-700 text-white shadow-lg' 
            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
        }`}
      >
          <Icon size={18} />
          <span className="text-sm md:text-base">{label}</span>
      </button>
  );

  return (
    <Layout userRole={currentUserRole}>
      {/* Tabs */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="flex w-full md:w-auto overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
            <TabButton id="official" label="Tin BTE04" icon={PenTool} />
            <TabButton id="experience" label="Góc Chia Sẻ" icon={MessageSquare} />
            <TabButton id="market" label="Chợ Nhà Nông" icon={ShoppingBag} />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            </div>
            <button 
                onClick={() => {
                    if (canCreateOfficial && activeTab === 'official') {
                        navigate('/create-article');
                    } else {
                        setShowPostModal(true);
                        // Default post type based on tab
                        if (activeTab === 'market') setPostType('market_sell');
                        else setPostType('experience');
                    }
                }}
                className="bg-earth-500 text-white px-4 py-3 rounded-full font-bold hover:bg-earth-600 transition shadow-md whitespace-nowrap"
            >
                {canCreateOfficial && activeTab === 'official' ? 'Viết bài' : 'Đăng tin'}
            </button>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div 
              key={article.id}
              onClick={() => navigate(`/article/${article.id}`)}
              className={`
                bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border flex flex-col group
                ${article.type?.includes('market') ? 'border-yellow-200' : 'border-gray-100'}
              `}
            >
              <div className="h-52 overflow-hidden relative bg-gray-100">
                 <img 
                   src={article.imageUrl} 
                   alt={article.title} 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                 />
                 {/* Badges */}
                 <div className="absolute top-3 left-3 flex gap-2">
                    {article.type === 'market_sell' && <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">CẦN BÁN</span>}
                    {article.type === 'market_buy' && <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">CẦN MUA</span>}
                    {(!article.type || article.type === 'official') && <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">OFFICIAL</span>}
                 </div>
                 
                 {/* Price Overlay for Market */}
                 {article.price && (
                     <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-red-600 font-bold px-3 py-1 rounded-lg shadow-sm border border-red-100">
                         {article.price.toLocaleString('vi-VN')} đ
                     </div>
                 )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                  {article.title}
                </h3>
                
                {article.type?.includes('market') && (
                    <div className="space-y-1 mb-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        {article.location && <div className="flex items-center gap-1"><MapPin size={14}/> {article.location}</div>}
                        {article.contactPhone && <div className="flex items-center gap-1 font-bold text-primary-700"><Phone size={14}/> {article.contactPhone}</div>}
                    </div>
                )}

                {!article.type?.includes('market') && (
                    <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
                        {article.summary}
                    </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-4 mt-auto">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{article.date}</span>
                  </div>
                  <div className="flex items-center space-x-1 font-medium text-gray-500">
                    {article.authorRole === UserRole.ADMIN || article.authorRole === UserRole.TECHNICAL 
                        ? <span className="text-primary-600 flex items-center gap-1"><PenTool size={12}/> BTE04</span> 
                        : article.author
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredArticles.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <ShoppingBag className="mx-auto text-gray-300 mb-2" size={48} />
              <p className="text-gray-500">Chưa có bài viết nào trong mục này.</p>
              <button 
                onClick={() => setShowPostModal(true)}
                className="mt-4 text-primary-600 font-bold hover:underline"
              >
                  Đăng tin ngay
              </button>
          </div>
      )}

      {/* CREATE POST MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 className="font-bold text-lg text-gray-800">Đăng tin mới</h3>
                    <button onClick={() => setShowPostModal(false)} className="text-gray-500 hover:text-red-500"><X size={24}/></button>
                </div>
                
                <form onSubmit={handleCreatePost} className="p-6 space-y-4">
                    {/* Type Selector */}
                    <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
                        {[
                            {id: 'experience', label: 'Chia sẻ'},
                            {id: 'market_sell', label: 'Cần Bán'},
                            {id: 'market_buy', label: 'Cần Mua'}
                        ].map(type => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setPostType(type.id as ArticleType)}
                                className={`text-sm py-2 rounded-md font-medium transition-all ${postType === type.id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề {postType === 'experience' ? '(Tùy chọn)' : '(Bắt buộc)'}</label>
                        <input 
                            type="text"
                            required={postType !== 'experience'}
                            value={postTitle}
                            onChange={(e) => setPostTitle(e.target.value)}
                            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder={postType === 'experience' ? 'VD: Kinh nghiệm nuôi heo...' : 'VD: Bán 50 con heo thịt...'}
                        />
                    </div>

                    {/* Market Specific Fields */}
                    {postType !== 'experience' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
                                <input 
                                    type="text"
                                    value={postPrice}
                                    onChange={(e) => setPostPrice(e.target.value)}
                                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Liên hệ"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
                                <input 
                                    type="text"
                                    required
                                    value={postLocation}
                                    onChange={(e) => setPostLocation(e.target.value)}
                                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="VD: Đồng Nai"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại liên hệ</label>
                                <input 
                                    type="text"
                                    required
                                    value={postPhone}
                                    onChange={(e) => setPostPhone(e.target.value)}
                                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="0912..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết</label>
                        <textarea 
                            required
                            rows={5}
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Mô tả chi tiết..."
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
                        {!postImage ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-500"
                            >
                                <ImageIcon size={24} className="mb-2"/>
                                <span className="text-sm">Thêm ảnh (Tối đa 5MB)</span>
                            </div>
                        ) : (
                            <div className="relative rounded-lg overflow-hidden border">
                                <img src={postImage} alt="Preview" className="w-full h-48 object-cover"/>
                                <button
                                    type="button"
                                    onClick={() => setPostImage('')}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500"
                                >
                                    <X size={16}/>
                                </button>
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                        >
                            {submitting ? 'Đang đăng...' : 'ĐĂNG TIN NGAY'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </Layout>
  );
};

export default NewsFeed;