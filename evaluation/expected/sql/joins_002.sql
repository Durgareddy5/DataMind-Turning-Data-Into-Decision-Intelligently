SELECT employee_id, COUNT(*) AS order_count
FROM orders
GROUP BY employee_id
ORDER BY employee_id;
