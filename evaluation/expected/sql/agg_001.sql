SELECT r.region_name,
       SUM(oi.quantity * oi.unit_price * (1 - COALESCE(oi.discount_percent, 0) / 100.0)) AS total_revenue
FROM regions r
JOIN customers c ON r.region_id = c.region_id
JOIN orders o ON c.customer_id = o.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY r.region_name
ORDER BY total_revenue DESC;
