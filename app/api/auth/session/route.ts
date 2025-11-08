import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Реализовать проверку сессии через NextAuth
  // Пока возвращаем пустой объект (нет сессии)
  return NextResponse.json({ user: null });
}

