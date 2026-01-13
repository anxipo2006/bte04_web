import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, TrendingUp, Award, CheckCircle, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-primary-900 rounded-3xl overflow-hidden shadow-xl mb-12 relative">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="relative z-10 px-8 py-20 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Về BTE04</h1>
          <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
            Giải pháp chăn nuôi toàn diện, đồng hành cùng người nông dân Việt Nam nâng tầm giá trị nông sản.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Câu chuyện của chúng tôi</h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                Được thành lập với niềm đam mê cháy bỏng dành cho nông nghiệp, BTE04 không chỉ là một nhà cung cấp sản phẩm chăn nuôi, mà là một người bạn đồng hành tin cậy trên mọi hành trình của người nông dân.
              </p>
              <p>
                Chúng tôi thấu hiểu những khó khăn về dịch bệnh, giá cả thị trường và kỹ thuật mà bà con gặp phải. BTE04 ra đời để giải quyết những bài toán đó bằng công nghệ, tri thức và sự tận tâm.
              </p>
              <p className="font-semibold text-primary-700">
                "Thành công của bạn là niềm tự hào của chúng tôi."
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1516467508483-a72120615613?auto=format&fit=crop&q=80" className="rounded-2xl shadow-lg w-full h-48 object-cover mt-8" alt="Farm 1" />
            <img src="https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?auto=format&fit=crop&q=80" className="rounded-2xl shadow-lg w-full h-48 object-cover" alt="Farm 2" />
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Giá trị cốt lõi</h2>
            <p className="text-gray-500 mt-2">Kim chỉ nam cho mọi hoạt động tại BTE04</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <ValueCard 
              icon={<Shield className="w-10 h-10 text-primary-600" />}
              title="Chất Lượng Hàng Đầu"
              desc="Cam kết cung cấp các sản phẩm đạt chuẩn, an toàn sinh học và mang lại hiệu quả kinh tế cao nhất."
            />
            <ValueCard 
              icon={<Users className="w-10 h-10 text-earth-600" />}
              title="Cộng Đồng Gắn Kết"
              desc="Xây dựng mạng lưới kết nối giữa người chăn nuôi và chuyên gia, chia sẻ kiến thức thực chiến."
            />
            <ValueCard 
              icon={<TrendingUp className="w-10 h-10 text-blue-600" />}
              title="Đổi Mới Sáng Tạo"
              desc="Liên tục cập nhật kỹ thuật mới, áp dụng công nghệ vào quy trình chăn nuôi hiện đại."
            />
          </div>
        </div>

        {/* Vision Mission */}
        <div className="bg-primary-50 rounded-3xl p-8 md:p-12 mb-20 border border-primary-100">
            <div className="flex flex-col md:flex-row gap-10">
                <div className="flex-1">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-primary-900 mb-4">
                        <Award className="w-8 h-8"/> Sứ mệnh
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                        Nâng cao năng suất và chất lượng sản phẩm chăn nuôi Việt Nam thông qua việc cung cấp giải pháp dinh dưỡng tối ưu và hỗ trợ kỹ thuật chuyên sâu, giúp người chăn nuôi làm giàu bền vững trên chính mảnh đất quê hương.
                    </p>
                </div>
                <div className="w-px bg-primary-200 hidden md:block"></div>
                <div className="flex-1">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-primary-900 mb-4">
                        <CheckCircle className="w-8 h-8"/> Tầm nhìn
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                        Trở thành hệ sinh thái chăn nuôi số 1 tại khu vực, nơi mọi vấn đề từ con giống, thức ăn đến đầu ra thị trường đều được giải quyết nhanh chóng và minh bạch.
                    </p>
                </div>
            </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Bạn đã sẵn sàng tham gia cùng chúng tôi?</h2>
            <button 
                onClick={() => navigate('/dashboard')}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all inline-flex items-center gap-2"
            >
                Vào ứng dụng ngay <ArrowRight size={20}/>
            </button>
        </div>
      </div>
    </Layout>
  );
};

const ValueCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-center">
    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-600">{desc}</p>
  </div>
);

export default About;