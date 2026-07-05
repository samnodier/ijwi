export type User = {
  id: string;
  email: string;
  name: string;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type SignupData = AuthCredentials & {
  name: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};
