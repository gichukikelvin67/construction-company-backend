import { UserRole } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        company: string;
      };
    }
  }
}

export {};