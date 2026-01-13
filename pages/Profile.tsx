import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { auth, getUserRole, updateUserProfile } from '../services/firebase';
import { UserRole } from '../types';
import { User, Phone, Shield, Calendar, Award, Edit2, Save, X, Activity } from 'lucide-react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

const Profile: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      displayName: '',
      age: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
      // 1. Get basic Auth Data
      const currentUser = auth.currentUser || JSON.parse(localStorage.getItem('bte04_demo_user') || 'null');
      
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // 2. Get Firestore Profile Data (Role, Activated Code, etc.)
      try {
        const db = getFirestore();
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { ...currentUser, ...docSnap.data() };
          setUserData(data);
          // Pre-fill form
          setEditForm({
              displayName: data.displayName || '',
              age: data.age ? data.age.toString() : ''
          });
        } else {
          setUserData(currentUser);
          setEditForm({
            displayName: currentUser.displayName || '',
            age: ''
        });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setUserData(currentUser);
      } finally {
        setLoading(false);
      }
  };

  const handleSave = async () => {
      if (!userData) return;
      setSaveLoading(true);
      try {
          const updateData: any = {
              displayName: editForm.displayName.trim()
          };
          
          if (editForm.age) {
              updateData.age = parseInt(editForm.age);
          }

          await updateUserProfile(userData.uid, updateData);
          
          // Refresh local state without reload
          setUserData({ ...userData, ...updateData });
          setIsEditing(false);
          alert('Cập nhật thông tin thành công!');
      } catch (error) {
          alert('Lỗi khi cập nhật. Vui lòng thử lại.');
      } finally {
          setSaveLoading(false);
      }
  };

  if (loading) return (
    <Layout>
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
    </Layout>
  );

  if (!userData) return <Layout><div>Vui lòng đăng nhập.</div></Layout>;

  // Format Role Name
  const getRoleName = (role: string) => {
      switch(role) {
          case UserRole.ADMIN: return 'Quản Trị Viên (Admin)';
          case UserRole.TECHNICAL: return 'Chuyên Gia Kỹ Thuật';
          default: return 'Thành Viên Chính Thức';
      }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Hồ sơ cá nhân</h1>
            {!isEditing && (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-primary-600 font-medium hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors"
                >
                    <Edit2 size={18}/> Chỉnh sửa
                </button>
            )}
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
            {/* Header Background */}
            <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800"></div>
            
            <div className="px-8 pb-8">
                {/* Avatar */}
                <div className="relative -mt-12 mb-6">
                    <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md inline-block">
                        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl font-bold">
                            {userData.email ? userData.email[0].toUpperCase() : 'U'}
                        </div>
                    </div>
                </div>

                {/* Edit Form / View Info */}
                <div className="space-y-6">
                    <div>
                        {isEditing ? (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
                                <input 
                                    type="text"
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-xl font-bold text-gray-900"
                                    placeholder="Nhập tên của bạn"
                                />
                            </div>
                        ) : (
                            <h2 className="text-2xl font-bold text-gray-900">
                                {userData.displayName || 'Thành viên BTE04'}
                            </h2>
                        )}
                        
                        <p className="text-gray-500">
                             ID: {userData.uid?.slice(0, 8)}...
                        </p>
                    </div>

                    <div className="grid gap-4 border-t pt-6">
                        {/* Phone - Read Only */}
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Phone size={20}/></div>
                            <div>
                                <p className="text-xs text-gray-400">Số điện thoại</p>
                                <p className="font-medium text-gray-800">{userData.phoneNumber || userData.email?.replace('@bte04.com', '') || 'Chưa cập nhật'}</p>
                            </div>
                        </div>

                         {/* Age - Editable */}
                         <div className="flex items-center gap-3">
                            <div className="bg-red-50 p-2 rounded-lg text-red-600"><Activity size={20}/></div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-400">Tuổi</p>
                                {isEditing ? (
                                    <input 
                                        type="number"
                                        value={editForm.age}
                                        onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                                        className="w-full mt-1 px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Nhập tuổi"
                                    />
                                ) : (
                                    <p className="font-medium text-gray-800">{userData.age ? `${userData.age} tuổi` : 'Chưa cập nhật'}</p>
                                )}
                            </div>
                        </div>

                        {/* Role - Read Only */}
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><Shield size={20}/></div>
                            <div>
                                <p className="text-xs text-gray-400">Hạng thành viên</p>
                                <p className="font-medium text-purple-700 font-bold">{getRoleName(userData.role)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><Award size={20}/></div>
                            <div>
                                <p className="text-xs text-gray-400">Mã sản phẩm đã kích hoạt</p>
                                <p className="font-mono font-medium bg-gray-100 px-2 py-0.5 rounded inline-block text-sm text-gray-800">
                                    {userData.activatedCode || 'Không có dữ liệu'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-green-50 p-2 rounded-lg text-green-600"><Calendar size={20}/></div>
                            <div>
                                <p className="text-xs text-gray-400">Ngày tham gia</p>
                                <p className="font-medium text-gray-800">
                                    {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Actions */}
                {isEditing && (
                    <div className="mt-8 flex gap-3">
                        <button 
                            onClick={handleSave}
                            disabled={saveLoading}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                            {saveLoading ? 'Đang lưu...' : <><Save size={18}/> Lưu Thay Đổi</>}
                        </button>
                        <button 
                            onClick={() => {
                                setIsEditing(false);
                                setEditForm({
                                    displayName: userData.displayName || '',
                                    age: userData.age ? userData.age.toString() : ''
                                });
                            }}
                            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            <X size={18}/> Hủy
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;