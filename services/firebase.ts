import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit
} from "firebase/firestore";
import { ProductCode, Article, UserProfile, UserRole, Question, SpinPrize, ChatMessage } from '../types';

// Helper để lấy biến môi trường an toàn
const getEnv = (key: string): string => {
  try {
    const meta = import.meta as any;
    // Kiểm tra Vite env
    if (meta.env && meta.env[key]) {
      return meta.env[key];
    }
    // Kiểm tra Process env
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    console.warn(`Error reading env var ${key}`, e);
  }
  return "";
};

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || "AIzaSyARCrPs1hBDx_NFv9h9NM3hke1vi1FFrTo",
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || "livestock-web-4478c.firebaseapp.com",
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || "livestock-web-4478c",
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || "livestock-web-4478c.firebasestorage.app",
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || "648177635180",
  appId: getEnv('VITE_FIREBASE_APP_ID') || "1:648177635180:web:1aa7d46d29f701927fad49",
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || "G-60B62GPVK6"
};

// SECURITY FIX: Không bao giờ để giá trị mặc định cho Master Key trong code.
// Nếu không có biến môi trường, Master Key sẽ là chuỗi rỗng => Không ai đăng nhập được Admin.
const MASTER_KEY = getEnv('VITE_ADMIN_SECRET_CODE');

const app = firebase.initializeApp(firebaseConfig);
export const auth = app.auth();
export const db = getFirestore(app);

export const formatPhoneToEmail = (phone: string) => `${phone}@bte04.com`;
export const DEMO_USER_KEY = 'bte04_demo_user'; 

export const SPIN_PRIZES: SpinPrize[] = [
  { id: 'p1', label: 'Thẻ 10k', color: '#fbbf24', probability: 30 },
  { id: 'p2', label: 'Mã giảm 5%', color: '#34d399', probability: 20 },
  { id: 'p3', label: 'Chúc may mắn', color: '#9ca3af', probability: 40 },
  { id: 'p4', label: 'Áo thun BTE', color: '#f87171', probability: 5 },
  { id: 'p5', label: '1 Bao BTE04', color: '#60a5fa', probability: 5 },
];

// --- HELPERS ---

export const logoutUser = async () => {
  try {
    localStorage.removeItem(DEMO_USER_KEY);
    await auth.signOut();
  } catch (e) {
    console.error(e);
  }
};

// --- REAL FIRESTORE SERVICES ---

// ARTICLES & POSTS
export const getArticles = async (): Promise<Article[]> => {
  try {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
  } catch (error) {
    console.error("Error getting articles:", error);
    return [];
  }
};

export const getArticleById = async (id: string): Promise<Article | null> => {
  try {
    const docRef = doc(db, 'articles', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Article;
    }
    return null;
  } catch (error) {
    console.error("Error getting article:", error);
    return null;
  }
};

export const createArticle = async (article: Partial<Article>): Promise<void> => {
  try {
    // Nếu status chưa được set, mặc định là approved (cho Admin), nhưng nên để pending cho user
    // Logic đó xử lý ở UI hoặc rules. Ở đây chỉ đẩy data lên.
    const newArticleData = {
      likes: [],
      comments: [],
      views: 0,
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      status: article.status || 'approved', // Default
      ...article,
    };
    await addDoc(collection(db, 'articles'), newArticleData);
  } catch (error) {
    console.error("Error creating article:", error);
    throw error;
  }
};

export const updateArticle = async (id: string, data: Partial<Article>): Promise<void> => {
    try {
        const docRef = doc(db, 'articles', id);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Error updating article:", error);
        throw error;
    }
};

export const deleteArticle = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'articles', id));
  } catch (error) {
    console.error("Error deleting article:", error);
    throw error;
  }
};

export const toggleLikeArticle = async (articleId: string, userId: string): Promise<Article | null> => {
  try {
    const docRef = doc(db, 'articles', articleId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const article = docSnap.data() as Article;
      let newLikes = article.likes || [];
      
      if (newLikes.includes(userId)) {
        newLikes = newLikes.filter(id => id !== userId);
      } else {
        newLikes.push(userId);
      }
      
      await updateDoc(docRef, { likes: newLikes });
      return { ...article, likes: newLikes, id: articleId };
    }
  } catch (error) {
    console.error("Error toggling like:", error);
  }
  return null;
};

export const addComment = async (articleId: string, comment: { userId: string, userName: string, text: string }): Promise<void> => {
  try {
    const docRef = doc(db, 'articles', articleId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const article = docSnap.data() as Article;
      const newComment = {
        id: 'cmt-' + Date.now(),
        ...comment,
        createdAt: Date.now()
      };
      const newComments = [...(article.comments || []), newComment];
      await updateDoc(docRef, { comments: newComments });
    }
  } catch (error) {
    console.error("Error adding comment:", error);
  }
};

export const deleteComment = async (articleId: string, commentId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const article = docSnap.data() as Article;
            const newComments = (article.comments || []).filter(c => c.id !== commentId);
            await updateDoc(docRef, { comments: newComments });
        }
    } catch (error) {
        console.error("Error deleting comment:", error);
    }
};

// QUESTIONS (QA)
export const getQuestions = async (): Promise<Question[]> => {
  try {
    const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  } catch (error) {
    console.error("Error getting questions:", error);
    return [];
  }
};

export const createQuestion = async (question: { userId: string, userName: string, title: string, content: string }): Promise<void> => {
  try {
    const newQ = {
      ...question,
      createdAt: Date.now(),
      answers: [],
      isResolved: false,
      likes: []
    };
    await addDoc(collection(db, 'questions'), newQ);
  } catch (error) {
    console.error("Error creating question:", error);
    throw error;
  }
};

export const updateQuestion = async (id: string, data: Partial<Question>): Promise<void> => {
    try {
        const docRef = doc(db, 'questions', id);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Error updating question:", error);
        throw error;
    }
};

export const deleteQuestion = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'questions', id));
    } catch (error) {
        console.error("Error deleting question:", error);
        throw error;
    }
};

export const addAnswer = async (questionId: string, answer: { userId: string, userName: string, userRole: UserRole, content: string }): Promise<void> => {
  try {
    const docRef = doc(db, 'questions', questionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const q = docSnap.data() as Question;
      const newAnswer = {
        id: 'ans-' + Date.now(),
        ...answer,
        createdAt: Date.now()
      };
      const newAnswers = [...(q.answers || []), newAnswer];
      await updateDoc(docRef, { answers: newAnswers });
    }
  } catch (error) {
    console.error("Error adding answer:", error);
  }
};

export const deleteAnswer = async (questionId: string, answerId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'questions', questionId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const q = docSnap.data() as Question;
            const newAnswers = (q.answers || []).filter(a => a.id !== answerId);
            await updateDoc(docRef, { answers: newAnswers });
        }
    } catch (error) {
        console.error("Error deleting answer:", error);
    }
};

// CHAT REALTIME
export const sendChatMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<void> => {
    try {
        await addDoc(collection(db, 'chat_messages'), {
            ...message,
            createdAt: Date.now()
        });
    } catch (error) {
        console.error("Error sending chat:", error);
    }
};

export const subscribeToChat = (channelId: string, callback: (msgs: ChatMessage[]) => void) => {
    try {
        const q = query(
            collection(db, 'chat_messages'),
            where('channelId', '==', channelId)
        );
        
        return onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
                .sort((a, b) => a.createdAt - b.createdAt);
            
            callback(msgs);
        }, (error) => {
            console.error("Chat Snapshot Error:", error);
        });
    } catch (error) {
        console.error("Error sub chat:", error);
        return () => {};
    }
};

// LUCKY SPIN
export const canUserSpin = async (uid: string): Promise<{ allowed: boolean, remainingDays?: number }> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return { allowed: true };

    const userData = userDoc.data() as UserProfile;
    const lastSpin = userData.lastSpinTime || 0;
    
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (now - lastSpin > oneWeek) return { allowed: true };
    
    const remainingTime = oneWeek - (now - lastSpin);
    const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
    return { allowed: false, remainingDays };
  } catch (error) {
    return { allowed: false, remainingDays: 7 };
  }
};

export const recordSpin = async (uid: string, prizeId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { 
      lastSpinTime: Date.now(),
    });
  } catch (error) {
    console.error("Error recording spin:", error);
  }
};

// USERS & CODES
export const verifyProductCode = async (code: string): Promise<boolean> => {
  // BẢO MẬT: Kiểm tra key từ biến môi trường, nếu chưa set env thì mặc định fail
  if (MASTER_KEY && code === MASTER_KEY) return true;

  try {
    const codeRef = doc(db, 'product_codes', code);
    const codeSnap = await getDoc(codeRef);
    
    if (codeSnap.exists()) {
      const data = codeSnap.data() as ProductCode;
      return !data.isUsed;
    }
    return false;
  } catch (error) {
    console.error("Error verifying code:", error);
    return false;
  }
};

export const markCodeAsUsed = async (code: string, uid: string) => {
  if (MASTER_KEY && code === MASTER_KEY) return;

  try {
    const codeRef = doc(db, 'product_codes', code);
    await updateDoc(codeRef, { 
      isUsed: true, 
      usedBy: uid,
      usedAt: Date.now() 
    });
  } catch (error) {
    console.error("Error marking code:", error);
  }
};

export const createUserProfile = async (uid: string, phoneNumber: string, code: string) => {
  try {
    let role = UserRole.USER;
    let allowedChannels = ['general']; 
    
    if (MASTER_KEY && code === MASTER_KEY) {
      role = UserRole.ADMIN;
      allowedChannels = ['general', 'pig', 'chicken', 'technical', 'market'];
    }
    
    const userProfile: UserProfile = {
      uid,
      phoneNumber,
      role: role,
      activatedCode: code,
      createdAt: Date.now(),
      allowedChannels: allowedChannels
    };
    await setDoc(doc(db, 'users', uid), userProfile);
  } catch (error) {
    console.error("Error creating profile:", error);
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  try {
    // 1. Update Firestore Document
    // Sử dụng setDoc với { merge: true } để an toàn hơn updateDoc nếu document chưa tồn tại
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, data, { merge: true });

    // 2. Sync Display Name with Firebase Auth if provided
    if (data.displayName && auth.currentUser) {
       await auth.currentUser.updateProfile({
           displayName: data.displayName
       });
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// GET FULL USER PROFILE
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const getUserRole = async (uid: string): Promise<UserRole> => {
  try {
    const p = await getUserProfile(uid);
    return p?.role || UserRole.USER;
  } catch (error) {
    return UserRole.USER;
  }
};

// Admin: Get all users
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
  } catch (error) {
    return [];
  }
};

// Admin: Update user channels
export const updateUserChannels = async (uid: string, channels: string[]) => {
  try {
    // Dùng setDoc merge để tránh lỗi nếu user doc thiếu
    await setDoc(doc(db, 'users', uid), {
      allowedChannels: channels
    }, { merge: true });
  } catch (error) {
    console.error("Error updating channels:", error);
    throw error;
  }
};

export const getProductCodes = async (): Promise<ProductCode[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'product_codes'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductCode));
  } catch (error) {
    return [];
  }
};