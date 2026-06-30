// server/src/middleware/auth.ts
// Supabase JWT authentication middleware

import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string | undefined;
      };
    }
  }
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1] ?? null;
}

/**
 * Middleware that requires a valid Supabase JWT.
 * Returns 401 if no valid token is provided.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    res.status(500).json({ error: 'Auth service not configured' });
    return;
  }

  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
    };
    next();
  } catch (err) {
    console.error('[Auth] Error verifying token:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Middleware that optionally attaches user info if a valid token is provided.
 * Does not reject requests without a token.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    next();
    return;
  }

  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email,
      };
    }
  } catch (err) {
    console.error('[Auth] Error in optional auth:', err);
  }

  next();
}
