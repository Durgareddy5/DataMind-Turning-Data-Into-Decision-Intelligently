SELECT c.customer_name, r.region_name
FROM customers c
JOIN regions r ON c.region_id = r.region_id
ORDER BY c.customer_name;
