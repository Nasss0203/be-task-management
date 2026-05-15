export type IAuth = {
  id: string;
  username: string;
  email: string;
  sub?: string;
  systemRole: SystemRole;
};
