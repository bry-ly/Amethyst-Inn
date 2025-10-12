// Feedback/Testimonial types
export type FeedbackCategory = 
  | "service" 
  | "cleanliness" 
  | "amenities" 
  | "location" 
  | "value" 
  | "overall";

export interface FeedbackResponse {
  message: string;
  respondedBy?: {
    _id: string;
    name: string;
  };
  respondedAt?: string;
}

export interface Feedback {
  _id: string;
  user: {
    _id: string;
    name: string;
    email?: string;
  };
  booking?: {
    _id: string;
    checkInDate?: string;
    checkOutDate?: string;
    room?: any;
  };
  rating: number;
  category: FeedbackCategory;
  title: string;
  message: string;
  isApproved: boolean;
  isPublic: boolean;
  response?: FeedbackResponse;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackPayload {
  booking?: string;
  rating: number;
  category?: FeedbackCategory;
  title: string;
  message: string;
  isPublic?: boolean;
}

export interface UpdateFeedbackPayload {
  rating?: number;
  category?: FeedbackCategory;
  title?: string;
  message?: string;
  isPublic?: boolean;
}

export interface FeedbackApiResponse {
  success: boolean;
  data?: Feedback;
  count?: number;
  message?: string;
  error?: string;
}

export interface FeedbackListResponse {
  success: boolean;
  data: Feedback[];
  count: number;
}

export interface FeedbackStats {
  overall: {
    totalFeedback: number;
    averageRating: number;
    approvedCount: number;
    pendingCount: number;
  };
  ratingDistribution: Array<{
    _id: number;
    count: number;
  }>;
  categoryDistribution: Array<{
    _id: string;
    count: number;
    avgRating: number;
  }>;
}
