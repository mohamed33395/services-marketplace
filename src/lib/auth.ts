import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(payload: JWTPayload): Promise<string> {
  const expiresIn = JWT_EXPIRES_IN.endsWith('d')
    ? parseInt(JWT_EXPIRES_IN) * 24 * 60 * 60
    : parseInt(JWT_EXPIRES_IN) * 60 * 60;

  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, email: string, role: UserRole): Promise<string> {
  const session = await prisma.session.create({
    data: {
      userId,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const token = await createToken({
    userId,
    email,
    role,
    sessionId: session.id,
  });

  await prisma.session.update({
    where: { id: session.id },
    data: { token },
  });

  return token;
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const session = await prisma.session.findFirst({
    where: {
      userId: payload.userId,
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) return null;

  return payload;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      customer: true,
      admin: true,
    },
  });

  return user;
}

export async function deleteSession(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

export function setAuthCookie(token: string): void {
  // This is handled in API routes
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new Error('Forbidden');
  }
  return user;
}

export function checkPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}
