import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { auth, getUserRole } from '../services/firebase';
import { UserRole } from '../types';
import { User, Phone, Shield, Calendar, Award } from 'lucide-react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

const Profile: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          setUserData({ ...currentUser, ...docSnap.data() });
        } else {
          // Fallback if firestore record missing
          setUserData(currentUser);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setUserData(currentUser);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Hồ sơ cá nhân</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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

                {/* Info List */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {userData.displayName || 'Thành viên BTE04'}
                        </h2>
                        <p className="text-gray-500">
                             ID: {userData.uid?.slice(0, 8)}...
                        </p>
                    </div>

                    <div className="grid gap-4 border-t pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Phone size={20}/></div>
                            <div>
                                <p className="text-xs text-gray-400">Số điện thoại</p>
                                <p className="font-medium">{userData.phoneNumber || userData.email?.replace('@bte04.com', '') || 'Chưa cập nhật'}</p>
                            </div>
                        </div>

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
                                <p className="font-mono font-medium bg-gray-100 px-2 py-0.5 rounded inline-block text-sm">
                                    {userData.activatedCode || 'Không có dữ liệu'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-green-50 p-2 rounded-lg text-green-600"><Calendar size={20}/></div>
                            <div>
                                <p className="text-xs text-gray-400">Ngày tham gia</p>
                                <p className="font-medium">
                                    {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;