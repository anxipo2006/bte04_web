export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  TECHNICAL = 'technical' // Kỹ thuật viên/Chuyên gia
}

export interface UserProfile {
  uid: string;
  phoneNumber: string;
  role: UserRole;
  activatedCode: string;
  createdAt: number;
  displayName?: string;
  lastSpinTime?: number; // Thời gian quay thưởng lần cuối
}

export interface ProductCode {
  id: string; 
  isUsed: boolean;
  usedBy?: string; 
  createdAt: number;
}

export interface Article {
  id: string;
  title: string;
  category: 'news' | 'technical' | 'guide' | 'case_study';
  summary: string;
  content: string; 
  imageUrl: string;
  author: string;
  views: number;
  date: string;
  tags: string[];
  likes: string[]; // Danh sách UID người like
  comments: Comment[];
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
  userRole: UserRole; // Để highlight câu trả lời của Admin/Technical
  content: string;
  createdAt: number;
}

export interface SpinPrize {
  id: string;
  label: string;
  color: string;
  probability: number; // 0-100
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
};