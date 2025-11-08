import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Простая проверка сессии через cookie
    // TODO: Реализовать полноценную проверку через NextAuth
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_session');
    
    if (sessionToken?.value) {
      // Есть сессия
      return NextResponse.json({ 
        user: { 
          email: sessionToken.value 
        } 
      });
    }
    
    // Нет сессии
    return NextResponse.json({ user: null });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}

