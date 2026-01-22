// Auth hook (prepared for future implementation)
import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  return useAuthContext();
};
