import { createBrowserClient } from '@supabase/ssr';

export function createClient(rememberMe: boolean = true) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Return a dummy proxy during build time so it doesn't throw errors
    return new Proxy({} as any, {
      get(target, prop) {
        // Return dummy functions for auth/other properties to prevent crashes on reference
        if (prop === 'auth') {
          return new Proxy({} as any, {
            get(t, p) {
              return () => {
                throw new Error("Supabase auth method called during build or without environment variables.");
              };
            }
          });
        }
        return () => {
          throw new Error(`Supabase method ${String(prop)} called during build or without environment variables.`);
        };
      }
    });
  }

  return createBrowserClient(
    url,
    anonKey,
    {
      isSingleton: false,
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return '';
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          if (match) return decodeURIComponent(match[2]);
          return '';
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return;
          
          let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
          
          if (options.domain) cookieString += `; domain=${options.domain}`;
          if (options.path) cookieString += `; path=${options.path}`;
          if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
          if (options.secure) cookieString += `; secure`;
          
          // Only add max-age and expires if rememberMe is true
          if (rememberMe) {
            if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
            if (options.expires) {
              const expiresDate = options.expires instanceof Date ? options.expires : new Date(options.expires);
              cookieString += `; expires=${expiresDate.toUTCString()}`;
            }
          }
          
          document.cookie = cookieString;
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return;
          let cookieString = `${encodeURIComponent(name)}=; max-age=0`;
          if (options.domain) cookieString += `; domain=${options.domain}`;
          if (options.path) cookieString += `; path=${options.path}`;
          document.cookie = cookieString;
        }
      }
    }
  );
}
