-- =============================================================
-- SmartStock — Initial Migration
-- Dibuat manual untuk keperluan dokumentasi.
-- Jalankan via: npx prisma migrate dev --name init
-- =============================================================

-- Enable UUID extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF_GUDANG', 'KASIR');
CREATE TYPE "LocationType" AS ENUM ('GUDANG', 'RAK', 'AREA', 'TOKO');
CREATE TYPE "StockMovementType" AS ENUM ('SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN', 'LOSS');
CREATE TYPE "OpnameStatus" AS ENUM ('IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');
CREATE TYPE "NotificationType" AS ENUM (
  'LOW_STOCK', 'EXPIRY', 'OPNAME_SUBMITTED', 'OPNAME_APPROVED', 'OPNAME_REJECTED'
);

-- =============================================================
-- TABLES
-- =============================================================

CREATE TABLE "users" (
  "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name"       VARCHAR(255) NOT NULL,
  "email"      VARCHAR(255) NOT NULL UNIQUE,
  "password"   TEXT NOT NULL,
  "role"       "UserRole" NOT NULL DEFAULT 'STAFF_GUDANG',
  "is_active"  BOOLEAN NOT NULL DEFAULT TRUE,
  "tenant_id"  UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");
CREATE INDEX "users_email_idx" ON "users"("email");

CREATE TABLE "products" (
  "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sku"         VARCHAR(100) NOT NULL UNIQUE,
  "barcode"     VARCHAR(100) NOT NULL UNIQUE,
  "name"        VARCHAR(255) NOT NULL,
  "category"    VARCHAR(100),
  "description" TEXT,
  "min_stock"   INTEGER NOT NULL DEFAULT 0,
  "unit"        VARCHAR(50) NOT NULL DEFAULT 'pcs',
  "price"       DECIMAL(15,2),
  "image_url"   TEXT,
  "expiry_date" DATE,
  "is_active"   BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "products_sku_idx" ON "products"("sku");
CREATE INDEX "products_barcode_idx" ON "products"("barcode");
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE INDEX "products_expiry_date_idx" ON "products"("expiry_date");

CREATE TABLE "locations" (
  "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name"        VARCHAR(255) NOT NULL,
  "type"        "LocationType" NOT NULL DEFAULT 'GUDANG',
  "description" TEXT,
  "is_active"   BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cache stok terkini — JANGAN diupdate langsung via API
CREATE TABLE "stock_levels" (
  "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "product_id"  UUID NOT NULL REFERENCES "products"("id"),
  "location_id" UUID NOT NULL REFERENCES "locations"("id"),
  "quantity"    INTEGER NOT NULL DEFAULT 0,
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("product_id", "location_id")
);
CREATE INDEX "stock_levels_product_id_idx" ON "stock_levels"("product_id");
CREATE INDEX "stock_levels_location_id_idx" ON "stock_levels"("location_id");

-- Ledger APPEND-ONLY — sumber kebenaran stok
CREATE TABLE "stock_movements" (
  "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "product_id"      UUID NOT NULL REFERENCES "products"("id"),
  "location_id"     UUID REFERENCES "locations"("id"),
  "actor_id"        UUID NOT NULL REFERENCES "users"("id"),
  "type"            "StockMovementType" NOT NULL,
  "quantity_change" INTEGER NOT NULL,
  "quantity_before" INTEGER NOT NULL,
  "quantity_after"  INTEGER NOT NULL,
  "reference_id"    UUID,
  "notes"           TEXT,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "stock_movements_product_id_idx"  ON "stock_movements"("product_id");
CREATE INDEX "stock_movements_actor_id_idx"    ON "stock_movements"("actor_id");
CREATE INDEX "stock_movements_location_id_idx" ON "stock_movements"("location_id");
CREATE INDEX "stock_movements_created_at_idx"  ON "stock_movements"("created_at");
CREATE INDEX "stock_movements_type_idx"        ON "stock_movements"("type");

CREATE TABLE "stock_opname_sessions" (
  "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "location_id"  UUID NOT NULL REFERENCES "locations"("id"),
  "started_by"   UUID NOT NULL REFERENCES "users"("id"),
  "approved_by"  UUID REFERENCES "users"("id"),
  "status"       "OpnameStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "review_notes" TEXT,
  "started_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "submitted_at" TIMESTAMPTZ,
  "approved_at"  TIMESTAMPTZ
);
CREATE INDEX "opname_sessions_location_id_idx" ON "stock_opname_sessions"("location_id");
CREATE INDEX "opname_sessions_started_by_idx"  ON "stock_opname_sessions"("started_by");
CREATE INDEX "opname_sessions_status_idx"      ON "stock_opname_sessions"("status");
CREATE INDEX "opname_sessions_started_at_idx"  ON "stock_opname_sessions"("started_at");

CREATE TABLE "stock_opname_items" (
  "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "session_id"   UUID NOT NULL REFERENCES "stock_opname_sessions"("id") ON DELETE CASCADE,
  "product_id"   UUID NOT NULL REFERENCES "products"("id"),
  "system_qty"   INTEGER NOT NULL,
  "physical_qty" INTEGER NOT NULL,
  "difference"   INTEGER NOT NULL, -- physicalQty - systemQty
  "notes"        TEXT,
  UNIQUE("session_id", "product_id")
);
CREATE INDEX "opname_items_session_id_idx" ON "stock_opname_items"("session_id");
CREATE INDEX "opname_items_product_id_idx" ON "stock_opname_items"("product_id");

-- Audit trail APPEND-ONLY
CREATE TABLE "audit_logs" (
  "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "actor_id"    UUID NOT NULL REFERENCES "users"("id"),
  "action"      VARCHAR(100) NOT NULL,
  "entity_type" VARCHAR(100) NOT NULL,
  "entity_id"   UUID NOT NULL,
  "old_value"   JSONB,
  "new_value"   JSONB,
  "ip_address"  VARCHAR(45),
  "user_agent"  TEXT,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "audit_logs_actor_id_idx"           ON "audit_logs"("actor_id");
CREATE INDEX "audit_logs_entity_type_entity_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_logs_created_at_idx"         ON "audit_logs"("created_at");

-- Cegah UPDATE/DELETE pada audit_logs di level database
CREATE RULE "audit_logs_no_update" AS ON UPDATE TO "audit_logs" DO INSTEAD NOTHING;
CREATE RULE "audit_logs_no_delete" AS ON DELETE TO "audit_logs" DO INSTEAD NOTHING;

CREATE TABLE "notifications" (
  "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id"    UUID NOT NULL REFERENCES "users"("id"),
  "type"       "NotificationType" NOT NULL,
  "title"      VARCHAR(255) NOT NULL,
  "message"    TEXT NOT NULL,
  "is_read"    BOOLEAN NOT NULL DEFAULT FALSE,
  "data"       JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");
CREATE INDEX "notifications_user_id_idx"          ON "notifications"("user_id");
CREATE INDEX "notifications_created_at_idx"       ON "notifications"("created_at");

-- =============================================================
-- POSTGRESQL FUNCTION: update_stock_levels()
-- Dipanggil otomatis setelah INSERT ke stock_movements.
-- Ini satu-satunya jalur resmi untuk mengupdate stock_levels.
-- =============================================================

CREATE OR REPLACE FUNCTION update_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock_levels (product_id, location_id, quantity)
  VALUES (NEW.product_id, NEW.location_id, NEW.quantity_after)
  ON CONFLICT (product_id, location_id)
  DO UPDATE SET
    quantity   = EXCLUDED.quantity,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock_on_movement
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  WHEN (NEW.location_id IS NOT NULL)
  EXECUTE FUNCTION update_stock_levels();
