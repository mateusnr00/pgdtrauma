import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';

/**
 * Issues short-lived client tokens so the admin uploads images and videos straight from the
 * browser to Vercel Blob (no 4.5 MB function body limit). Only a logged-in admin gets a token.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await isAdmin())) throw new Error('Não autorizado.');
        if (!pathname.startsWith('media/')) throw new Error('Caminho inválido.');
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime'],
          maximumSizeInBytes: 300 * 1024 * 1024,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
