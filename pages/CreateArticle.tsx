import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { createArticle, auth } from '../services/firebase';
import { UserRole } from '../types';
import { Save, X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

// Declare global variable for CKEditor loaded via CDN
declare const ClassicEditor: any;

const CreateArticle: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Ref for the editor DOM element
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
     if (auth.currentUser) {
         setCurrentUser(auth.currentUser);
     }
  }, []);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'technical' as any,
    summary: '',
    content: '',
    imageUrl: '', // This will store the Base64 string
    tags: ''
  });
  const [loading, setLoading] = useState(false);

  // Initialize CKEditor
  useEffect(() => {
    if (editorRef.current && !editorInstanceRef.current && typeof ClassicEditor !== 'undefined') {
      ClassicEditor
        .create(editorRef.current, {
          toolbar: [ 
            'heading', '|', 
            'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
            'outdent', 'indent', '|',
            'blockQuote', 'insertTable', 'undo', 'redo' 
          ],
          placeholder: 'Nhập nội dung chi tiết bài viết tại đây...',
          heading: {
            options: [
                { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                { model: 'heading2', view: 'h2', title: 'Tiêu đề lớn', class: 'ck-heading_heading2' },
                { model: 'heading3', view: 'h3', title: 'Tiêu đề nhỏ', class: 'ck-heading_heading3' }
            ]
          }
        })
        .then((editor: any) => {
          editorInstanceRef.current = editor;
          
          if (formData.content) {
            editor.setData(formData.content);
          }

          editor.model.document.on('change:data', () => {
            const data = editor.getData();
            setFormData(prev => ({ ...prev, content: data }));
          });
        })
        .catch((error: any) => {
          console.error('CKEditor Error:', error);
        });
    }

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Image Upload & Compress to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith('image/')) {
        alert('Vui lòng chỉ chọn file ảnh.');
        return;
    }

    // Limit large files before processing
    if (file.size > 10 * 1024 * 1024) {
        alert('File ảnh quá lớn (>10MB). Vui lòng chọn ảnh nhỏ hơn.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
        const img = new window.Image();
        img.onload = () => {
            // Resize logic to save DB space (Firestore document limit is 1MB)
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Resize width to 800px
            let newWidth = img.width;
            let newHeight = img.height;

            if (img.width > MAX_WIDTH) {
                const scaleSize = MAX_WIDTH / img.width;
                newWidth = MAX_WIDTH;
                newHeight = img.height * scaleSize;
            }

            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, newWidth, newHeight);

            // Compress to JPEG 70% quality
            const base64String = canvas.toDataURL('image/jpeg', 0.7);
            setFormData(prev => ({ ...prev, imageUrl: base64String }));
        };
        img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
      setFormData(prev => ({ ...prev, imageUrl: '' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!formData.content.trim()) {
        alert('Vui lòng nhập nội dung bài viết.');
        setLoading(false);
        return;
    }

    // Default image if none uploaded
    const finalImage = formData.imageUrl || 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80';
    
    const authorName = currentUser?.displayName || 'Ban Kỹ Thuật';

    try {
      await createArticle({
        title: formData.title,
        category: formData.category,
        summary: formData.summary,
        content: formData.content, 
        imageUrl: finalImage,
        author: authorName, 
        tags: formData.tags.split(',').map(t => t.trim())
      });
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Lỗi khi đăng bài. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout userRole={UserRole.TECHNICAL}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Đăng bài viết mới</h1>
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề bài viết</label>
            <input
              required
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-bold text-lg"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="VD: Hướng dẫn kỹ thuật úm gà..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as any})}
              >
                <option value="technical">Kỹ thuật</option>
                <option value="news">Tin tức</option>
                <option value="guide">Hướng dẫn</option>
                <option value="case_study">Case thực tế</option>
              </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tags (cách nhau dấu phẩy)</label>
               <input
                type="text"
                placeholder="Heo, Gà, Vacxin"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.tags}
                onChange={e => setFormData({...formData, tags: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh bìa</label>
            
            {!formData.imageUrl ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-primary-500 transition-colors"
                >
                    <div className="bg-primary-50 p-3 rounded-full mb-3">
                        <Upload className="text-primary-600" size={24} />
                    </div>
                    <span className="text-gray-600 font-medium">Nhấn để tải ảnh từ máy tính</span>
                    <span className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG (Tự động nén tối ưu)</span>
                </div>
            ) : (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 inline-block group">
                    <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="h-48 w-auto object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                            title="Xóa ảnh"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            )}
            
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tóm tắt ngắn (Hiển thị bên ngoài)</label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.summary}
              onChange={e => setFormData({...formData, summary: e.target.value})}
              placeholder="Mô tả ngắn gọn về nội dung bài viết..."
            />
          </div>

          <div className="prose-editor-container">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết</label>
            {/* CKEditor Container */}
            <div className="border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                <div ref={editorRef}></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              * Bạn có thể copy/paste trực tiếp từ Word hoặc Google Docs vào đây.
            </p>
          </div>

          <div className="pt-4 border-t sticky bottom-0 bg-white z-10">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-700 text-white py-3 rounded-lg font-bold hover:bg-primary-800 transition flex justify-center items-center gap-2 shadow-lg"
            >
              <Save size={20} />
              {loading ? 'Đang xử lý...' : 'Đăng bài viết ngay'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateArticle;