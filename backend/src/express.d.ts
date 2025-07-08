declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      username: string;
      role: string;
      department?: string;
      companyId: string;
    }
    interface CompanyPayload {
      id: string;
      name: string;
      subscriptionTier: string;
      isActive: boolean;
    }
    interface Request {
      user?: UserPayload;
      company?: CompanyPayload;
    }
  }
} 