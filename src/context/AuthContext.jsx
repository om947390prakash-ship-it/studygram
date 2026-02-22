import { createContext, useContext } from "react";

// ✅ Named export: AuthContext
export const AuthContext = createContext(null);

// ✅ Hook
export function useAuth() {
  return useContext(AuthContext);
}