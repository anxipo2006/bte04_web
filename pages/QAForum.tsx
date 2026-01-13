import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, addAnswer, deleteAnswer, auth } from '../services/firebase';
import { Question, UserRole } from '../types';
import { MessageSquare, Plus, User, CheckCircle, Send, Edit2, Trash2, X } from 'lucide-react';

const QAForum: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAskModal, setShowAskModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  
  // Assuming logged in
  const currentUser = auth.currentUser || JSON.parse(localStorage.getItem('bte04_demo_user') || 'null');
  const userRole = currentUser?.role || UserRole.USER;

  useEffect(() => {
    loadQuestions();
  }, [showAskModal]);

  const loadQuestions = async () => {
    const data = await getQuestions();
    setQuestions(data);
  };

  const openCreateModal = () => {
      setEditingQuestionId(null);
      setFormData({ title: '', content: '' });
      setShowAskModal(true);
  };

  const openEditModal = (q: Question) => {
      setEditingQuestionId(q.id);
      setFormData({ title: q.title, content: q.content });
      setShowAskModal(true);
  };

  const handleDeleteQuestion = async (id: string) => {
      if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
          await deleteQuestion(id);
          setQuestions(prev => prev.filter(q => q.id !== id));
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (editingQuestionId) {
        await updateQuestion(editingQuestionId, {
            title: formData.title,
            content: formData.content
        });
        alert('Cập nhật câu hỏi thành công!');
    } else {
        await createQuestion({
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Thành viên',
          title: formData.title,
          content: formData.content
        });
    }

    setShowAskModal(false);
    loadQuestions();
  };

  const handleAnswer = async (qId: string) => {
    const text = answerTexts[qId];
    if (!text?.trim() || !currentUser) return;

    await addAnswer(qId, {
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Chuyên gia',
      userRole: userRole,
      content: text
    });

    setAnswerTexts({ ...answerTexts, [qId]: '' });
    loadQuestions();
  };

  const handleDeleteAnswer = async (qId: string, ansId: string) => {
      if (confirm('Xóa câu trả lời này?')) {
          await deleteAnswer(qId, ansId);
          loadQuestions();
      }
  };

  return (
    <Layout userRole={userRole}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Hỏi đáp Chuyên Gia</h1>
            <p className="text-gray-500">Đặt câu hỏi và nhận tư vấn từ đội ngũ kỹ thuật BTE04</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition"
          >
            <Plus size={20} /> Đặt câu hỏi
          </button>
        </div>

        <div className="space-y-6">
          {questions.map(q => {
            const isOwner = currentUser && q.userId === currentUser.uid;
            const canEdit = isOwner || userRole === UserRole.ADMIN;

            return (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                  <User size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{q.title}</h3>
                    {canEdit && (
                        <div className="flex gap-2">
                             <button onClick={() => openEditModal(q)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 size={16}/></button>
                             <button onClick={() => handleDeleteQuestion(q.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                        </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4">{q.content}</p>
                  <div className="text-xs text-gray-400 mb-6 flex gap-4">
                    <span>{q.userName}</span>
                    <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Answers */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                      <MessageSquare size={16} /> {q.answers.length} Câu trả lời
                    </h4>
                    
                    {q.answers.map(ans => {
                       const isAnsOwner = currentUser && ans.userId === currentUser.uid;
                       const canDeleteAns = isAnsOwner || userRole === UserRole.ADMIN; 
                       return (
                        <div key={ans.id} className={`p-3 rounded-lg border relative group/ans ${ans.userRole === UserRole.TECHNICAL || ans.userRole === UserRole.ADMIN ? 'bg-primary-50 border-primary-100' : 'bg-white border-gray-100'}`}>
                            <div className="flex justify-between items-start mb-1">
                            <span className={`font-bold text-sm ${ans.userRole === UserRole.TECHNICAL ? 'text-primary-700 flex items-center gap-1' : 'text-gray-800'}`}>
                                {ans.userName}
                                {ans.userRole === UserRole.TECHNICAL && <CheckCircle size={14} className="text-primary-600" />}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{new Date(ans.createdAt).toLocaleDateString()}</span>
                                {canDeleteAns && (
                                    <button onClick={() => handleDeleteAnswer(q.id, ans.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover/ans:opacity-100 transition-opacity">
                                        <X size={14}/>
                                    </button>
                                )}
                            </div>
                            </div>
                            <p className="text-sm text-gray-700">{ans.content}</p>
                        </div>
                       )
                    })}

                    {/* Input Answer */}
                    {(userRole === UserRole.TECHNICAL || userRole === UserRole.ADMIN || userRole === UserRole.USER) && (
                       <div className="flex gap-2 mt-2">
                         <input 
                           type="text" 
                           placeholder={userRole === UserRole.TECHNICAL ? "Trả lời với tư cách chuyên gia..." : "Thảo luận..."}
                           className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-primary-500 outline-none"
                           value={answerTexts[q.id] || ''}
                           onChange={e => setAnswerTexts({...answerTexts, [q.id]: e.target.value})}
                         />
                         <button 
                           onClick={() => handleAnswer(q.id)}
                           className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700"
                         >
                           <Send size={16} />
                         </button>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Modal Ask/Edit */}
      {showAskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold mb-4">{editingQuestionId ? 'Chỉnh sửa câu hỏi' : 'Đặt câu hỏi mới'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề (ngắn gọn)</label>
                <input required className="w-full border p-2 rounded-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chi tiết vấn đề</label>
                <textarea required rows={4} className="w-full border p-2 rounded-lg" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowAskModal(false)} className="flex-1 py-2 border rounded-lg text-gray-600">Hủy</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-bold">
                    {editingQuestionId ? 'Cập nhật' : 'Gửi câu hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default QAForum;