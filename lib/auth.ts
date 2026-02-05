import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import pool from './db';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

export interface SessionPayload {
    userId: number;
    email: string;
    role: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a random registration token (10 characters, alphanumeric)
 */
export function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    const randomBytes = crypto.randomBytes(10);

    for (let i = 0; i < 10; i++) {
        token += chars[randomBytes[i] % chars.length];
    }

    return token;
}

/**
 * Generate a cryptographically secure password reset token
 */
export function generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex'); // 32 bytes = 64 hex characters
}

/**
 * Store password reset token and expiry in the database
 */
export async function storePasswordResetToken(
    email: string,
    token: string
): Promise<void> {
    const expiresAt = new Date(Date.now() + 3600000); // Token valid for 1 hour

    await pool.query(
        'UPDATE users SET passwordResetToken = ?, passwordResetExpires = ? WHERE email = ?',
        [token, expiresAt, email]
    );
}

/**
 * Verify password reset token and return user email if valid
 */
export async function verifyPasswordResetToken(
    token: string
): Promise<string | null> {
    const [rows]: any = await pool.query(
        'SELECT email, passwordResetExpires FROM users WHERE passwordResetToken = ?',
        [token]
    );

    if (rows.length === 0) {
        return null; // Token not found
    }

    const user = rows[0];
    const now = new Date();

    if (user.passwordResetExpires < now) {
        return null; // Token expired
    }

    return user.email;
}

/**
 * Update user's password and clear reset token fields
 */
export async function updateUserPassword(
    email: string,
    newPassword: string
): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);

    await pool.query(
        'UPDATE users SET password = ?, passwordResetToken = NULL, passwordResetExpires = NULL WHERE email = ?',
        [hashedPassword, email]
    );
}

/**
 * Create a JWT session token
 */
export async function createSession(payload: SessionPayload): Promise<string> {
    const token = await new SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(JWT_SECRET);

    return token;
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySession(
    token: string
): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as SessionPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
        return null;
    }

    return verifySession(token);
}

/**
 * Set the session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
    });
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

/**
 * Require authentication - use in API routes
 */
export async function requireAuth(): Promise<SessionPayload> {
    const session = await getSession();

    if (!session) {
        throw new Error('Unauthorized');
    }

    return session;
}

/**
 * Require superadmin role
 */
export async function requireSuperadmin(): Promise<SessionPayload> {
    const session = await requireAuth();

    if (session.role !== 2) {
        throw new Error('Forbidden: Superadmin access required');
    }

    return session;
}
