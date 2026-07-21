import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  r2Client,
  R2_BUCKET,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
  generateProductImageKey,
  buildPublicUrl,
} from '@/lib/r2';

/**
 * POST /api/upload/presign
 *
 * Generate pre-signed URL untuk upload file langsung dari browser ke R2.
 * Browser akan PUT file langsung ke R2 (tidak melalui server Next.js),
 * sehingga tidak membebani serverless function dengan transfer data besar.
 *
 * Request body:
 *   { productId: string, mimeType: string, fileSize: number }
 *
 * Response:
 *   { uploadUrl: string, publicUrl: string, key: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { productId, mimeType, fileSize } = body as {
      productId?: string;
      mimeType?: string;
      fileSize?: number;
    };

    // Validasi
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'productId diperlukan' }, { status: 400 });
    }
    if (!mimeType || !ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Tipe file tidak didukung. Gunakan: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }
    if (!fileSize || fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Ukuran file maksimal ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const key = generateProductImageKey(productId, mimeType);

    // Generate pre-signed URL yang berlaku 5 menit
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: mimeType,
      ContentLength: fileSize,
      // Metadata untuk audit
      Metadata: {
        'uploaded-by': (session.user as any).id || 'unknown',
        'product-id': productId,
      },
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
    const publicUrl = buildPublicUrl(key);

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (err: any) {
    console.error('[POST /api/upload/presign]', err);
    return NextResponse.json({ error: 'Gagal membuat pre-signed URL' }, { status: 500 });
  }
}
