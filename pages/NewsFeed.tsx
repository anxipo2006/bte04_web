import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getArticles, auth, getUserRole } from '../services/firebase';
import { Article, UserRole } from '../types';
import { Search, Calendar, Eye, PenTool } from 'lucide-react';
import Layout from '../components/Layout';

const NewsFeed: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(UserRole.USER);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const fetchedArticles = await getArticles();
      setArticles(fetchedArticles);
      
      const user = auth.currentUser || JSON.parse(localStorage.getItem('bte04_demo_user') || 'null');
      if (user) {
         if (user.role) setCurrentUserRole(user.role); // local storage fallback
         else {
             const role = await getUserRole(user.uid);
             setCurrentUserRole(role);
         }
         // Quick fix for master admin in Auth.tsx
         if (user.email?.startsWith('admin')) setCurrentUserRole(UserRole.ADMIN);
      }

      setLoading(false);
    };

    init();
  }, []);

  const filteredArticles = articles.filter(art => {
    const matchesFilter = filter === 'all' || art.category === filter;
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          art.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'news', label: 'Tin tức' },
    { id: 'technical', label: 'Kỹ thuật' },
    { id: 'guide', label: 'HDSD BTE04' },
    { id: 'case_study', label: 'Thực tế' },
  ];

  const canCreate = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.TECHNICAL;

  return (
    <Layout userRole={currentUserRole}>
      {/* Search & Filter Header */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 w-full max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          {canCreate && (
             <button
               onClick={() => navigate('/create-article')}
               className="whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-primary-700 text-white shadow-md hover:bg-primary-800 transition-colors mr-2"
             >
               <PenTool size={16} /> Viết bài
             </button>
          )}

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === cat.id 
                  ? 'bg-primary-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div 
              key={article.id}
              onClick={() => navigate(`/article/${article.id}`)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group border border-gray-100 flex flex-col"
            >
              <div className="h-48 overflow-hidden relative">
                 <img 
                   src={article.imageUrl} 
                   alt={article.title} 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                 />
                 <div className="absolute top-4 left-4">
                   <span className="bg-earth-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase">
                     {categories.find(c => c.id === article.category)?.label}
                   </span>
                 </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
                  {article.summary}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-4">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{article.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye size={14} />
                    <span>{article.views}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && filteredArticles.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">Không tìm thấy bài viết nào.</p>
          {canCreate && (
              <button 
                onClick={() => navigate('/create-article')}
                className="mt-4 text-primary-600 font-bold hover:underline"
              >
                Tạo bài viết đầu tiên ngay
              </button>
          )}
        </div>
      )}
    </Layout>
  );
};

export default NewsFeed;