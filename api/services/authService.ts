
import { getDb } from './db.js';
import type { User } from '../types/index.js';

export async function login(username: string, password: string, role: string): Promise<User | null> {
  const db = await getDb();
  
  const user = await db.get(
    'SELECT * FROM users WHERE username = ? AND password = ? AND role = ?',
    [username, password, role]
  );
  
  if (!user) return null;
  
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    province: user.province,
    city: user.city,
    permissions: JSON.parse(user.permissions || '[]')
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDb();
  
  const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
  
  if (!user) return null;
  
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    province: user.province,
    city: user.city,
    permissions: JSON.parse(user.permissions || '[]')
  };
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  
  const users = await db.all('SELECT * FROM users ORDER BY created_at DESC');
  
  return users.map((u: any) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    province: u.province,
    city: u.city,
    permissions: JSON.parse(u.permissions || '[]')
  }));
}
