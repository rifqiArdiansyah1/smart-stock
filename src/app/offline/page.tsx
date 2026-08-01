"use client";

export default function OfflinePage() {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Offline — SmartStock</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 24px;
            padding: 48px 40px;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 25px 50px rgba(0,0,0,0.4);
          }
          .icon {
            font-size: 64px;
            margin-bottom: 24px;
            display: block;
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 800;
            color: #f1f5f9;
            margin-bottom: 12px;
          }
          p {
            color: #94a3b8;
            line-height: 1.6;
            font-size: 0.95rem;
            margin-bottom: 32px;
          }
          .features {
            background: #0f172a;
            border-radius: 16px;
            padding: 20px;
            text-align: left;
            margin-bottom: 32px;
          }
          .features h3 {
            font-size: 0.75rem;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
          }
          .feature-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 0;
            font-size: 0.875rem;
            color: #cbd5e1;
          }
          .feature-item + .feature-item {
            border-top: 1px solid #1e293b;
          }
          .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
          .btn {
            display: inline-block;
            background: #6366f1;
            color: white;
            padding: 12px 28px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.95rem;
            cursor: pointer;
            border: none;
            transition: background 0.2s;
          }
          .btn:hover { background: #818cf8; }
        `}</style>
      </head>
      <body>
        <div className="card">
          <span className="icon">📡</span>
          <h1>Koneksi Tidak Tersedia</h1>
          <p>
            Anda sedang offline. Beberapa fitur SmartStock tetap bisa digunakan
            karena data disimpan di perangkat Anda.
          </p>
          <div className="features">
            <h3>Masih bisa dilakukan offline:</h3>
            <div className="feature-item">
              <div className="dot"></div>
              Input stok fisik di Workspace Opname
            </div>
            <div className="feature-item">
              <div className="dot"></div>
              Scan barcode produk via kamera
            </div>
            <div className="feature-item">
              <div className="dot"></div>
              Melihat halaman yang sudah pernah dibuka
            </div>
          </div>
          <button className="btn" onClick={() => window.location.reload()}>
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
