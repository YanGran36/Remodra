// Authentication interceptor for better session management
export const authInterceptor = {
  // Check if response indicates auth failure
  isAuthError: (response: Response): boolean => {
    return response.status === 401 || response.status === 403;
  },

  // Handle auth errors consistently
  handleAuthError: (error: any): boolean => {
    if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
      // Clear any cached auth data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Redirect to auth page if not already there
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
      return true;
    }
    return false;
  },

  // Add auth headers if available
  addAuthHeaders: (headers: HeadersInit = {}): HeadersInit => {
    const token = localStorage.getItem('token');
    if (token) {
      return {
        ...headers,
        'Authorization': `Bearer ${token}`,
      };
    }
    return headers;
  }
};