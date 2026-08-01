INSERT INTO stock_levels (id, product_id, location_id, quantity)
SELECT uuid_generate_v4(), id, (SELECT id FROM locations LIMIT 1), 0
FROM products LIMIT 1;
