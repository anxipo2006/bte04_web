export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  TECHNICAL = 'technical'
}

export interface UserProfile {
  uid: string;
  phoneNumber: string;
  role: UserRole;
  activatedCode: string;
  createdAt: number;
  displayName?: string;
  lastSpinTime?: number;
  allowedChannels?: string[]; // Danh sách ID nhóm chat được phép vào
}

export interface ProductCode {
  id: string; 
  isUsed: boolean;
  usedBy?: string; 
  createdAt: number;
}

export type ArticleType = 'official' | 'experience' | 'market_sell' | 'market_buy';

export interface Article {
  id: string;
  title: string;
  category: 'news' | 'technical' | 'guide' | 'case_study' | 'experience' | 'market';
  type?: ArticleType; // Phân loại bài viết
  summary: string;
  content: string; 
  imageUrl: string;
  author: string;
  authorId?: string; // ID người đăng
  authorRole?: UserRole;
  views: number;
  date: string;
  tags: string[];
  likes: string[];
  comments: Comment[];
  
  // Marketplace specific
  price?: number;
  location?: string;
  contactPhone?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

export interface Question {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  createdAt: number;
  answers: Answer[];
  isResolved: boolean;
  likes: string[];
}

export interface Answer {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: number;
}

export interface SpinPrize {
  id: string;
  label: string;
  color: string;
  probability: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  channelId: string;
  createdAt: number;
}

export type ChatChannel = {
  id: string;
  name: string;
  description: string;
  icon: string;
  isRestricted?: boolean; // Nhóm cần cấp quyền
};