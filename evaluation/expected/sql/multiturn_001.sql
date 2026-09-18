-- Turn 1
SELECT SUM(oi.quantity * oi.unit_price * (1 - COALESCE(oi.discount_percent, 0) / 100.0)) AS total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN customers c ON o.customer_id = c.customer_id
JOIN regions r ON c.region_id = r.region_id
WHERE r.region_name = 'South India';

-- Turn 2 (same as agg_002.sql — the follow-up must resolve "that" to South India revenue)
SELECT p.category,
       SUM(oi.quantity * oi.unit_price * (1 - COALESCE(oi.discount_percent, 0) / 100.0)) AS revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
JOIN orders o ON oi.order_id = o.order_id
JOIN customers c ON o.customer_id = c.customer_id
JOIN regions r ON c.region_id = r.region_id
WHERE r.region_name = 'South India'
GROUP BY p.category
ORDER BY revenue DESC;
