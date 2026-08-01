CREATE OR REPLACE FUNCTION update_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock_levels (id, product_id, location_id, quantity)
  VALUES (uuid_generate_v4(), NEW.product_id, NEW.location_id, NEW.quantity_after)
  ON CONFLICT (product_id, location_id)
  DO UPDATE SET
    quantity   = EXCLUDED.quantity,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
