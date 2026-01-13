import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticleById, toggleLikeArticle, addComment, auth, deleteComment } from '../services/firebase';
import { Article, Comment } from '../types';
import Layout from '../components/Layout';
import { ArrowLeft, Calendar, User, MessageCircle, Heart, Send, Trash2 } from 'lucide-react';

const ArticleDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current user from auth (or local fallback in services)
    const user = auth.currentUser || JSON.parse(localStorage.getItem('bte04_demo_user') || 'null');
    setCurrentUser(user);
    
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    if (id) {
      const data = await getArticleById(id);
      setArticle(data ? { ...data } : null); // Clone to force re-render
    }
    setLoading(false);
  };

  const handleLike = async () => {
    if (!article || !currentUser) return;
    // Optimistic UI update
    const isLiked = article.likes.includes(currentUser.uid);
    let newLikes = isLiked 
      ? article.likes.filter(uid => uid !== currentUser.uid)
      : [...article.likes, currentUser.uid];
    
    setArticle({ ...article, likes: newLikes });
    
    // API Call
    await toggleLikeArticle(article.id, currentUser.uid);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article || !currentUser || !commentText.trim()) return;

    const newCommentData = {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email || 'Thành viên',
      text: commentText
    };

    await addComment(article.id, newCommentData);
    setCommentText('');
    await fetchArticle(); // Refresh to show new comment
  };

  const handleDeleteComment = async (commentId: string) => {
      if (!article || !confirm('Xóa bình luận này?')) return;
      await deleteComment(article.id, commentId);
      await fetchArticle();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  if (!article) return <div className="text-center py-20">Bài viết không tồn tại</div>;

  const isLiked = currentUser && article.likes.includes(currentUser.uid);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary-700 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        <article className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 mb-8">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-64 md:h-96 object-cover"
          />
          
          <div className="p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
              <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full font-bold uppercase text-xs">
                {article.category}
              </span>
              <div className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>{article.date}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User size={16} />
                <span>{article.author}</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Content Protected Area */}
            <div 
              className="prose prose-lg prose-emerald max-w-none text-gray-700 protected-content mb-8"
              onContextMenu={(e) => {
                e.preventDefault();
                alert('Nội dung độc quyền của BTE04. Vui lòng không sao chép.');
              }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
            
            {/* Social Actions */}
            <div className="flex items-center space-x-4 border-t border-b border-gray-100 py-4 mb-8">
              <button 
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                  isLiked ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                <span className="font-bold">{article.likes.length}</span>
                <span className="hidden md:inline">Thích</span>
              </button>
              <div className="flex items-center space-x-2 px-4 py-2 text-gray-500">
                <MessageCircle size={20} />
                <span className="font-bold">{article.comments.length}</span>
                <span className="hidden md:inline">Bình luận</span>
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h4 className="font-bold text-xl text-gray-800 mb-6">Bình luận</h4>
              
              {/* Comment List */}
              <div className="space-y-6 mb-8">
                {article.comments.length === 0 ? (
                  <p className="text-gray-400 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                ) : (
                  article.comments.map((cmt) => (
                    <div key={cmt.id} className="flex space-x-3 group">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
                        {cmt.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none flex-1 relative">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-gray-800 text-sm">{cmt.userName}</span>
                          <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{new Date(cmt.createdAt).toLocaleDateString()}</span>
                              {currentUser && cmt.userId === currentUser.uid && (
                                  <button onClick={() => handleDeleteComment(cmt.id)} className="text-gray-400 hover:text-red-500 p-1">
                                      <Trash2 size={14}/>
                                  </button>
                              )}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{cmt.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Form */}
              <form onSubmit={handleComment} className="relative">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Viết bình luận của bạn..."
                  className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={!commentText.trim()}
                  className="absolute right-2 top-2 p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </article>
      </div>
    </Layout>
  );
};

export default ArticleDetail;