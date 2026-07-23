/**
 * Unit Tests: Kalkulasi Selisih Opname
 *
 * Menguji logika kalkulasi difference = physicalQty - systemQty
 * dan kalkulasi nilai kerugian = |difference| * price
 */

// ── Helper functions yang diuji ────────────────────────────────────────────────
// (diambil dari logika yang ada di API opname approval)

function calculateDifference(physicalQty: number, systemQty: number): number {
  return physicalQty - systemQty;
}

function calculateLossValue(difference: number, price: number): number {
  return Math.abs(difference) * price;
}

function isDiscrepant(difference: number): boolean {
  return difference !== 0;
}

function categorizeDifference(difference: number): 'SURPLUS' | 'DEFICIT' | 'MATCH' {
  if (difference > 0) return 'SURPLUS';
  if (difference < 0) return 'DEFICIT';
  return 'MATCH';
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Kalkulasi Selisih Opname', () => {
  describe('calculateDifference', () => {
    it('selisih nol ketika stok cocok', () => {
      expect(calculateDifference(100, 100)).toBe(0);
    });

    it('selisih positif (surplus) ketika fisik lebih banyak', () => {
      expect(calculateDifference(105, 100)).toBe(5);
    });

    it('selisih negatif (deficit) ketika fisik lebih sedikit', () => {
      expect(calculateDifference(95, 100)).toBe(-5);
    });

    it('selisih = physicalQty ketika sistem menunjukkan 0', () => {
      expect(calculateDifference(10, 0)).toBe(10);
    });

    it('selisih = -(systemQty) ketika fisik 0 (barang hilang semua)', () => {
      expect(calculateDifference(0, 50)).toBe(-50);
    });
  });

  describe('calculateLossValue', () => {
    it('nilai kerugian = 0 ketika tidak ada selisih', () => {
      expect(calculateLossValue(0, 5000)).toBe(0);
    });

    it('nilai kerugian benar untuk deficit', () => {
      // 5 unit hilang @ Rp 3000 = Rp 15000
      expect(calculateLossValue(-5, 3000)).toBe(15000);
    });

    it('nilai kerugian benar untuk surplus (juga dihitung)', () => {
      // 3 unit lebih @ Rp 2000 = Rp 6000
      expect(calculateLossValue(3, 2000)).toBe(6000);
    });

    it('nilai kerugian = 0 jika harga tidak diketahui (0)', () => {
      expect(calculateLossValue(-10, 0)).toBe(0);
    });
  });

  describe('isDiscrepant', () => {
    it('mendeteksi selisih ada', () => {
      expect(isDiscrepant(-3)).toBe(true);
      expect(isDiscrepant(5)).toBe(true);
    });

    it('tidak ada selisih ketika cocok', () => {
      expect(isDiscrepant(0)).toBe(false);
    });
  });

  describe('categorizeDifference', () => {
    it('mengkategorikan SURPLUS dengan benar', () => {
      expect(categorizeDifference(10)).toBe('SURPLUS');
    });

    it('mengkategorikan DEFICIT dengan benar', () => {
      expect(categorizeDifference(-10)).toBe('DEFICIT');
    });

    it('mengkategorikan MATCH dengan benar', () => {
      expect(categorizeDifference(0)).toBe('MATCH');
    });
  });
});

describe('Kalkulasi Bulk Opname Session', () => {
  interface OpnameItem {
    productId: string;
    systemQty: number;
    physicalQty: number;
    price: number;
  }

  function calculateSessionSummary(items: OpnameItem[]) {
    const withDiff = items.map((item) => ({
      ...item,
      difference: calculateDifference(item.physicalQty, item.systemQty),
      lossValue: calculateLossValue(
        calculateDifference(item.physicalQty, item.systemQty),
        item.price
      ),
    }));

    return {
      totalItems: items.length,
      discrepantItems: withDiff.filter((i) => isDiscrepant(i.difference)).length,
      totalLossValue: withDiff.reduce((sum, i) => sum + i.lossValue, 0),
      items: withDiff,
    };
  }

  it('menghitung summary dengan benar untuk sesi dengan selisih campuran', () => {
    const items: OpnameItem[] = [
      { productId: 'p1', systemQty: 100, physicalQty: 100, price: 5000 },  // MATCH
      { productId: 'p2', systemQty: 50,  physicalQty: 45,  price: 10000 }, // DEFICIT -5
      { productId: 'p3', systemQty: 30,  physicalQty: 33,  price: 3000 },  // SURPLUS +3
    ];

    const summary = calculateSessionSummary(items);

    expect(summary.totalItems).toBe(3);
    expect(summary.discrepantItems).toBe(2);
    // Kerugian: (5 * 10000) + (3 * 3000) = 50000 + 9000 = 59000
    expect(summary.totalLossValue).toBe(59000);
  });

  it('mengembalikan 0 kerugian untuk sesi tanpa selisih', () => {
    const items: OpnameItem[] = [
      { productId: 'p1', systemQty: 20, physicalQty: 20, price: 5000 },
      { productId: 'p2', systemQty: 15, physicalQty: 15, price: 8000 },
    ];

    const summary = calculateSessionSummary(items);
    expect(summary.discrepantItems).toBe(0);
    expect(summary.totalLossValue).toBe(0);
  });
});
