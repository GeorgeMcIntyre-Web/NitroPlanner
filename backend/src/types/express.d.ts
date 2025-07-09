import 'express';

declare module 'express' {
  export interface Request {
    user?: {
      id: string;
      email: string;
      username: string;
      role: string;
      department: string;
      companyId: string;
    };
    company?: {
      id: string;
      name: string;
      subscriptionTier: string;
      isActive: boolean;
    };
  }
} 