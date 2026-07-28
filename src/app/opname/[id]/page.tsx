import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import OpnameWorkspace from './OpnameWorkspace';

export const metadata: Metadata = {
  title: 'Workspace Opname — SmartStock',
  description: 'Area kerja untuk menghitung fisik stok barang',
};

export default async function OpnameWorkspacePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRole = (session.user as any).role;

  const opnameSession = await db.stockOpnameSession.findUnique({
    where: { id },
    include: {
      location: true,
      startedBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true, sku: true, unit: true, barcode: true } }
        }
      }
    }
  });

  if (!opnameSession) redirect('/opname');

  // If session is still IN_PROGRESS, we need to fetch current system stock for that location
  let initialStock: any[] = [];
  if (opnameSession.status === 'IN_PROGRESS') {
    initialStock = await db.stockLevel.findMany({
      where: { locationId: opnameSession.locationId },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true, barcode: true } }
      }
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col h-screen">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <a href="/opname" className="hover:text-slate-600 transition-colors">Stock Opname</a>
            <span>/</span>
            <span className="text-slate-600 font-medium">Workspace</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            📍 {opnameSession.location.name}
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              opnameSession.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
              opnameSession.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' :
              opnameSession.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {opnameSession.status}
            </span>
          </h1>
        </div>
        <a href="/opname" className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors">
          Tutup Workspace
        </a>
      </header>

      <div className="flex-1 overflow-hidden">
        <OpnameWorkspace 
          sessionData={opnameSession as any} 
          systemStock={initialStock as any} 
          userRole={userRole}
        />
      </div>
    </main>
  );
}
