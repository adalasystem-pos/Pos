export type UserRole = 'admin' | 'manager' | 'cashier';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  active: boolean;
}
