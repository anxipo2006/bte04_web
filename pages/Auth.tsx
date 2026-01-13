import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, formatPhoneToEmail, verifyProductCode, markCodeAsUsed, createUserProfile, DEMO_USER_KEY } from '../services/firebase';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

const Auth: React.FC = () => {
  const [viewState, setViewState] = useState<'login' | 'register' | 'forgot'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [productCode, setProductCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    // FIX: Loại bỏ khoảng trắng thừa trong SĐT (ví dụ: "0912 345 678" -> "0912345678")
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    
    // VALIDATION: Kiểm tra input rỗng trước khi gọi Firebase
    if (!cleanPhone) {
        setError('Vui lòng nhập Số điện thoại hoặc Email.');
        setLoading(false);
        return;
    }

    // FIX: Nếu nhập vào là email (có @), giữ nguyên. Nếu là SĐT, thêm đuôi fake email.
    // Điều này giúp Admin đăng nhập bằng email thật mà không bị lỗi 'invalid-email' (double domain).
    const email = cleanPhone.includes('@') ? cleanPhone : formatPhoneToEmail(cleanPhone);

    try {
      if (viewState === 'login') {
        // --- LOGIN ---
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } else if (viewState === 'register') {
        // --- REGISTER ---
        // 1. Password Validation
        if (password.length < 6) {
            throw new Error("Mật khẩu phải có ít nhất 6 ký tự.");
        }
        if (!/[A-Z]/.test(password)) {
            throw new Error("Mật khẩu phải chứa ít nhất 1 chữ cái VIẾT HOA.");
        }

        // 2. Code Validation
        const isValid = await verifyProductCode(productCode.toUpperCase().trim());
        if (!isValid) {
          throw new Error("Mã sản phẩm không hợp lệ hoặc đã được sử dụng.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await createUserProfile(user.uid, cleanPhone, productCode.toUpperCase().trim());
        await markCodeAsUsed(productCode.toUpperCase().trim(), user.uid);

        navigate('/dashboard');
      } else if (viewState === 'forgot') {
        // --- FORGOT PASSWORD ---
        // Lưu ý: Hệ thống dùng Email giả lập từ SĐT (sđt@bte04.com). 
        // Firebase không thể gửi email về địa chỉ này.
        // Ta sẽ giả lập hoặc thông báo liên hệ Admin.
        
        if (cleanPhone.includes('@')) {
            // Nếu họ nhập email thật (Admin)
            await sendPasswordResetEmail(auth, cleanPhone);
            setSuccessMsg('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.');
        } else {
            // Nếu nhập SĐT
            setError('Với tài khoản đăng ký bằng SĐT, vui lòng liên hệ Admin BTE04 (Hotline: 0776563501) để được cấp lại mật khẩu.');
        }
        setLoading(false);
        return;
      }
    } catch (err: any) {
      const errorCode = err.code || '';
      const errorMessage = err.message || '';

      // Chỉ log lỗi hệ thống, không log lỗi người dùng nhập sai (để tránh spam console)
      if (errorCode !== 'auth/invalid-credential' && 
          errorCode !== 'auth/user-not-found' && 
          errorCode !== 'auth/wrong-password' &&
          errorCode !== 'auth/invalid-email') {
          console.error("Auth Error:", err);
      }

      // Fallback Local Mode logic (giữ nguyên như cũ)
      if ((errorCode === 'auth/configuration-not-found' || errorCode === 'auth/operation-not-allowed') && viewState !== 'forgot') {
        const role = (productCode === 'BTE04-MASTER' || email.includes('admin')) ? 'admin' : 'user';
        const fallbackUser = {
            uid: 'local-' + Date.now(),
            email: email,
            displayName: viewState === 'login' ? 'User (Local)' : (role === 'admin' ? 'Admin (Local)' : 'Member'),
            phoneNumber: cleanPhone,
            role: role
        };
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(fallbackUser));
        window.dispatchEvent(new Event('auth-change'));
        alert(`LƯU Ý: Đăng nhập thành công ở chế độ Offline.`);
        navigate('/dashboard');
        return;
      }

      // Error Handling
      // FIX: Gộp user-not-found và invalid-credential để thông báo rõ ràng hơn
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        setError('Tài khoản không tồn tại hoặc mật khẩu không đúng.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('Số điện thoại này đã được đăng ký.');
      } else if (errorCode === 'auth/invalid-email') {
        // FIX: Thông báo lỗi cụ thể cho định dạng email/sđt
        setError('Số điện thoại hoặc Email không hợp lệ.');
      } else if (errorCode === 'auth/weak-password') {
        setError('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
      } else if (errorMessage.includes('Mã sản phẩm') || errorMessage.includes('Mật khẩu')) {
        setError(errorMessage);
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Lỗi kết nối mạng. Vui lòng kiểm tra đường truyền.');
      } else {
        setError(errorMessage || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
      setLoading(false);
    } 
  };

  return (
    <div className="min-h-screen bg-earth-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary-900 p-6 text-center text-white relative">
          {viewState === 'forgot' && (
            <button onClick={() => {setViewState('login'); setError('');}} className="absolute left-4 top-6 text-white hover:text-gray-200">
                <ArrowLeft size={24} />
            </button>
          )}
          <h2 className="text-2xl font-bold">
            {viewState === 'login' && 'Đăng Nhập'}
            {viewState === 'register' && 'Kích Hoạt Tài Khoản'}
            {viewState === 'forgot' && 'Quên Mật Khẩu'}
          </h2>
          <p className="text-primary-100 text-sm mt-1">
            {viewState === 'login' && 'Chào mừng bạn quay trở lại'}
            {viewState === 'register' && 'Nhập mã BTE04 để bắt đầu'}
            {viewState === 'forgot' && 'Nhập SĐT để nhận hỗ trợ'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-start gap-2 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {successMsg && (
             <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-6 flex items-start gap-2 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 {viewState === 'register' ? 'Số điện thoại' : 'Số điện thoại hoặc Email'}
              </label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none transition"
                placeholder={viewState === 'forgot' ? "Nhập SĐT của bạn" : "0912345678"}
              />
            </div>

            {viewState !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu {viewState === 'register' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none transition"
                  placeholder="••••••"
                />
                {viewState === 'register' && (
                    <p className="text-xs text-gray-400 mt-1">
                        Yêu cầu: Tối thiểu 6 ký tự, có ít nhất 1 chữ in hoa.
                    </p>
                )}
                {viewState === 'login' && (
                  <div className="flex justify-end mt-1">
                    <button 
                      type="button"
                      onClick={() => {setViewState('forgot'); setError('');}}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}
              </div>
            )}

            {viewState === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã sản phẩm (In trên bao bì)</label>
                <input
                  type="text"
                  required
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-dashed border-earth-500 bg-earth-50 focus:ring-2 focus:ring-earth-500 outline-none transition uppercase placeholder-gray-400"
                  placeholder="VD: BTE04-2024"
                />
                 <p className="text-xs text-gray-400 mt-2 italic">
                  * Mã <b>BTE04-MASTER</b>: Quyền Admin.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 rounded-lg shadow transition-all flex justify-center items-center mt-6"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                viewState === 'login' ? 'Đăng Nhập' : (viewState === 'register' ? 'Kích Hoạt & Đăng Ký' : 'Gửi Yêu Cầu')
              )}
            </button>
          </form>

          {viewState !== 'forgot' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setViewState(viewState === 'login' ? 'register' : 'login');
                  setError('');
                  setProductCode('');
                }}
                className="text-primary-700 hover:text-primary-900 font-medium text-sm"
              >
                {viewState === 'login' ? 'Chưa có tài khoản? Kích hoạt ngay' : 'Đã có tài khoản? Đăng nhập'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;