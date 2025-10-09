// Cookie utility functions for frontend
export class CookieManager {
  // Get cookie value
  static getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  // Set cookie
  static setCookie(
    name: string, 
    value: string, 
    options: {
      days?: number;
      secure?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
      path?: string;
    } = {}
  ): void {
    if (typeof document === 'undefined') return;

    const {
      days = 7,
      secure = process.env.NODE_ENV === 'production',
      sameSite = 'lax',
      path = '/'
    } = options;

    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));

    let cookieString = `${name}=${value}; expires=${expires.toUTCString()}; path=${path}; SameSite=${sameSite}`;
    
    if (secure) {
      cookieString += '; Secure';
    }

    document.cookie = cookieString;
  }

  // Delete cookie
  static deleteCookie(name: string, path: string = '/'): void {
    if (typeof document === 'undefined') return;
    
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  }

  // Check if cookie exists
  static hasCookie(name: string): boolean {
    return this.getCookie(name) !== null;
  }

  // Get all cookies as object
  static getAllCookies(): Record<string, string> {
    if (typeof document === 'undefined') return {};
    
    const cookies: Record<string, string> = {};
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });
    return cookies;
  }
}

// Cookie consent utilities
export class CookieConsent {
  private static readonly CONSENT_COOKIE = 'cookie_consent';
  private static readonly CONSENT_STORAGE_KEY = 'cookie_consent_given';

  // Check if user has given consent
  static hasConsent(): boolean {
    const cookieConsent = CookieManager.getCookie(this.CONSENT_COOKIE);
    const storageConsent = localStorage.getItem(this.CONSENT_STORAGE_KEY);
    
    return cookieConsent === 'true' || storageConsent === 'true';
  }

  // Set consent
  static setConsent(consent: boolean): void {
    // Set in localStorage for immediate access
    localStorage.setItem(this.CONSENT_STORAGE_KEY, consent.toString());
    
    // Set cookie for backend access
    CookieManager.setCookie(this.CONSENT_COOKIE, consent.toString(), {
      days: 365, // 1 year
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }

  // Clear consent
  static clearConsent(): void {
    localStorage.removeItem(this.CONSENT_STORAGE_KEY);
    CookieManager.deleteCookie(this.CONSENT_COOKIE);
  }

  // Send consent to backend
  static async sendConsentToBackend(consent: boolean): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/cookie-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ consent }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.success;
      }
      return false; // non-200 -> treat as failure (will degrade gracefully)
    } catch (error) {
      console.error('Failed to send cookie consent to backend:', error);
      return false;
    }
  }

  // Complete consent flow
  static async setConsentComplete(consent: boolean): Promise<boolean> {
    // Always set locally first so UX proceeds even if backend call fails.
    this.setConsent(consent);
    const ok = await this.sendConsentToBackend(consent);
    if (!ok) {
      // Soft warn – don't block dismissal. Backend persistence is optional.
      console.warn('[CookieConsent] Backend persistence failed; proceeding with local consent only.');
      return true; // Treat as success for UI purposes.
    }
    return true;
  }
}

// Authentication token utilities with cookie consent
export class AuthTokenManager {
  private static readonly TOKEN_KEY = 'token';

  // Get token (checks both localStorage and cookies)
  static getToken(): string | null {
    try {
      // Check localStorage first
      const localToken = localStorage.getItem(this.TOKEN_KEY);
      if (localToken && localToken.trim()) {
        return localToken;
      }

      // Check cookies as fallback
      const cookieToken = CookieManager.getCookie('auth_token');
      if (cookieToken && cookieToken.trim()) {
        return cookieToken;
      }

      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Set token based on consent
  static setToken(token: string, useCookies: boolean = false): void {
    // Always store in localStorage for immediate access
    localStorage.setItem(this.TOKEN_KEY, token);

    // Store in cookies only if consent is given
    if (useCookies) {
      CookieManager.setCookie('auth_token', token, {
        days: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    } else {
      // If consent is revoked or not given, ensure cookie is cleared
      CookieManager.deleteCookie('auth_token');
    }
  }

  // Clear token from all storage
  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    CookieManager.deleteCookie('auth_token');
  }

  // Check if token exists
  static hasToken(): boolean {
    return this.getToken() !== null;
  }
}

export default {
  CookieManager,
  CookieConsent,
  AuthTokenManager
};
