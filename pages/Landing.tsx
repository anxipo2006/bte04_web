import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, CheckCircle, TrendingUp, Users, Info } from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1516467508483-a72120615613?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="container mx-auto px-4 py-20 relative z-10 flex flex-col items-center text-center">
          <div className="inline-block bg-earth-500 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
            Dành riêng cho khách hàng BTE04
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Nâng Tầm Chăn Nuôi <br/>
            <span className="text-primary-400">Cùng Chuyên Gia</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl">
            Truy cập kho tàng kiến thức kỹ thuật, tin tức thị trường và cộng đồng độc quyền.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
                onClick={() => navigate('/auth')}
                className="group bg-earth-500 hover:bg-earth-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all flex items-center justify-center space-x-2 text-lg"
            >
                <span>Đăng nhập / Kích hoạt</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
                onClick={() => navigate('/about')}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-full border border-white/30 backdrop-blur-sm transition-all flex items-center justify-center space-x-2"
            >
                <Info size={20} />
                <span>Tìm hiểu về BTE04</span>
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Quyền lợi thành viên</h2>
            <p className="text-gray-600 mt-2">Chỉ cần một mã BTE04 để mở khóa toàn bộ</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<TrendingUp className="text-earth-500" size={32} />}
              title="Tin tức thị trường"
              desc="Cập nhật giá cả heo, gà, vịt và thức ăn chăn nuôi hàng ngày. Dự báo xu hướng."
            />
            <FeatureCard 
              icon={<CheckCircle className="text-primary-500" size={32} />}
              title="Kỹ thuật chuyên sâu"
              desc="Hướng dẫn quy trình nuôi, phòng bệnh, và tối ưu FCR từ các kỹ sư đầu ngành."
            />
            <FeatureCard 
              icon={<Users className="text-blue-500" size={32} />}
              title="Cộng đồng kín"
              desc="Trao đổi kinh nghiệm thực tế, chia sẻ câu chuyện thành công với người nuôi khác."
            />
          </div>
        </div>
      </div>

      {/* Lock CTA */}
      <div className="py-16 container mx-auto px-4">
        <div className="bg-primary-50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between border border-primary-100">
          <div className="mb-6 md:mb-0 md:pr-8">
            <div className="flex items-center space-x-3 mb-4 text-primary-900">
               <Lock className="w-6 h-6" />
               <span className="font-bold text-lg">Nội dung bị khóa</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Bạn đã mua sản phẩm BTE04?</h3>
            <p className="text-gray-600">Sử dụng mã sản phẩm in trên bao bì để kích hoạt tài khoản VIP ngay hôm nay.</p>
          </div>
          <button 
            onClick={() => navigate('/auth')}
            className="whitespace-nowrap bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 px-8 rounded-lg shadow transition-colors"
          >
            Kích hoạt ngay
          </button>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{desc}</p>
  </div>
);

export default Landing;