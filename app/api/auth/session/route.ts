import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Простая проверка сессии через cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_session');
    
    if (sessionToken?.value) {
      // Есть сессия
      return NextResponse.json({ 
        user: { 
          email: sessionToken.value 
        } 
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }
    
    // Нет сессии
    return NextResponse.json({ 
      user: null 
    }, {
      status: 401,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Session check error:', error);
        }
        return NextResponse.json({ 
          user: null 
        }, {
          status: 500,
        });
      }
    }

