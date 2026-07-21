import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET } from '@/lib/r2';

/**
 * DELETE /api/upload/[key]
 *
 * Hapus file dari R2 bucket berdasarkan object key.
 * Key di-encode sebagai base64url untuk menghindari masalah routing dengan slash.
 *
 * Contoh: DELETE /api/upload/cHJvZHVjdHMvcHJvZC0xMjMuanBn
 *   → key: products/prod-123.jpg
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { key: encodedKey } = await params;

  try {
    // Decode dari base64url
    const key = Buffer.from(encodedKey, 'base64url').toString('utf-8');

    // Validasi key hanya boleh di dalam folder yang diizinkan
    if (!key.startsWith('products/')) {
      return NextResponse.json({ error: 'Key tidak valid' }, { status: 400 });
    }

    await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));

    return NextResponse.json({ success: true, key });
  } catch (err: any) {
    console.error(`[DELETE /api/upload/${encodedKey}]`, err);
    return NextResponse.json({ error: 'Gagal menghapus file' }, { status: 500 });
  }
}
