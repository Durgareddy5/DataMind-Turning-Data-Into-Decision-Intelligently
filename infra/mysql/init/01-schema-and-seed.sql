-- MySQL dump 10.13  Distrib 9.6.0, for macos26.3 (arm64)
--
-- Host: localhost    Database: sales_business
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `region_id` int NOT NULL,
  `customer_segment` enum('Consumer','Small Business','Enterprise') DEFAULT 'Consumer',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  KEY `fk_customer_region` (`region_id`),
  CONSTRAINT `fk_customer_region` FOREIGN KEY (`region_id`) REFERENCES `regions` (`region_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'TechNova Solutions','contact@technova.com','9876543210','Hyderabad','Telangana','India',1,'Enterprise','2026-09-17 17:09:46'),(2,'GreenLeaf Retail','info@greenleaf.com','9876543211','Bengaluru','Karnataka','India',1,'Small Business','2026-09-17 17:09:46'),(3,'Apex Industries','sales@apexindustries.com','9876543212','Chennai','Tamil Nadu','India',1,'Enterprise','2026-09-17 17:09:46'),(4,'Sunrise Traders','sunrise@gmail.com','9876543213','Mumbai','Maharashtra','India',3,'Small Business','2026-09-17 17:09:46'),(5,'BlueSky Enterprises','contact@bluesky.com','9876543214','Pune','Maharashtra','India',3,'Enterprise','2026-09-17 17:09:46'),(6,'Metro Mart','metromart@gmail.com','9876543215','Delhi','Delhi','India',2,'Consumer','2026-09-17 17:09:46'),(7,'Urban Foods','urbanfoods@gmail.com','9876543216','Kolkata','West Bengal','India',4,'Small Business','2026-09-17 17:09:46'),(8,'CloudNine Systems','admin@cloudnine.com','9876543217','Hyderabad','Telangana','India',1,'Enterprise','2026-09-17 17:09:46'),(9,'FutureTech Inc','sales@futuretech.com','9876543218','New York','New York','USA',5,'Enterprise','2026-09-17 17:09:46'),(10,'Global Retail Corp','contact@globalretail.com','9876543219','Berlin','Berlin','Germany',6,'Enterprise','2026-09-17 17:09:46'),(11,'SmartHome Store','smarthome@gmail.com','9876543220','Bengaluru','Karnataka','India',1,'Consumer','2026-09-17 17:09:46'),(12,'NextGen Software','hello@nextgen.com','9876543221','Noida','Uttar Pradesh','India',2,'Enterprise','2026-09-17 17:09:46');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(150) NOT NULL,
  `job_title` varchar(100) DEFAULT NULL,
  `region_id` int DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_employee_region` (`region_id`),
  CONSTRAINT `fk_employee_region` FOREIGN KEY (`region_id`) REFERENCES `regions` (`region_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'Rahul','Sharma','rahul.sharma@company.com','Sales Manager',1,'2021-04-12'),(2,'Priya','Reddy','priya.reddy@company.com','Sales Executive',1,'2022-07-18'),(3,'Arjun','Mehta','arjun.mehta@company.com','Sales Executive',2,'2022-01-10'),(4,'Sneha','Patel','sneha.patel@company.com','Account Manager',3,'2020-11-25'),(5,'Vikram','Singh','vikram.singh@company.com','Sales Manager',5,'2019-08-14'),(6,'Emma','Johnson','emma.johnson@company.com','Account Executive',6,'2023-02-20');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`order_item_id`),
  KEY `fk_order_item_order` (`order_id`),
  KEY `fk_order_item_product` (`product_id`),
  CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  CONSTRAINT `fk_order_item_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,3,85000.00,5.00),(2,1,10,5,8500.00,0.00),(3,2,3,2,68000.00,3.00),(4,2,11,2,9500.00,0.00),(5,3,4,4,115000.00,7.00),(6,3,12,4,29000.00,5.00),(7,4,6,3,70000.00,2.00),(8,4,13,5,12000.00,0.00),(9,5,8,8,18000.00,5.00),(10,5,10,8,8500.00,2.00),(11,6,5,2,75000.00,4.00),(12,6,14,1,85000.00,5.00),(13,7,9,3,35000.00,3.00),(14,7,13,5,12000.00,0.00),(15,8,1,5,85000.00,6.00),(16,8,8,5,18000.00,2.00),(17,9,4,8,115000.00,8.00),(18,9,12,8,29000.00,5.00),(19,10,15,3,145000.00,5.00),(20,10,14,4,85000.00,4.00),(21,11,2,5,72000.00,3.00),(22,11,11,5,9500.00,0.00),(23,12,5,4,75000.00,5.00),(24,12,7,3,65000.00,3.00),(25,13,9,5,35000.00,5.00),(26,13,10,10,8500.00,0.00),(27,14,1,2,85000.00,4.00),(28,14,6,3,70000.00,3.00),(29,15,4,5,115000.00,6.00),(30,15,15,2,145000.00,7.00),(31,16,3,3,68000.00,2.00),(32,16,8,6,18000.00,0.00),(33,17,7,4,65000.00,3.00),(34,17,12,4,29000.00,2.00),(35,18,14,2,85000.00,5.00),(36,18,13,5,12000.00,0.00),(37,19,6,2,70000.00,2.00),(38,19,8,4,18000.00,0.00),(39,20,4,3,115000.00,5.00),(40,20,10,5,8500.00,0.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `employee_id` int DEFAULT NULL,
  `order_date` date NOT NULL,
  `required_date` date DEFAULT NULL,
  `shipped_date` date DEFAULT NULL,
  `order_status` enum('Pending','Processing','Shipped','Delivered','Cancelled') DEFAULT 'Pending',
  `shipping_city` varchar(100) DEFAULT NULL,
  `shipping_country` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `fk_order_customer` (`customer_id`),
  KEY `fk_order_employee` (`employee_id`),
  CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`),
  CONSTRAINT `fk_order_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,1,'2026-01-05','2026-01-10','2026-01-08','Delivered','Hyderabad','India'),(2,2,2,'2026-01-12','2026-01-18','2026-01-15','Delivered','Bengaluru','India'),(3,3,2,'2026-01-20','2026-01-25','2026-01-23','Delivered','Chennai','India'),(4,4,4,'2026-02-02','2026-02-08','2026-02-05','Delivered','Mumbai','India'),(5,5,4,'2026-02-14','2026-02-20','2026-02-18','Delivered','Pune','India'),(6,6,3,'2026-02-22','2026-02-27','2026-02-25','Delivered','Delhi','India'),(7,7,3,'2026-03-03','2026-03-09','2026-03-07','Delivered','Kolkata','India'),(8,8,1,'2026-03-10','2026-03-16','2026-03-13','Delivered','Hyderabad','India'),(9,9,5,'2026-03-18','2026-03-25','2026-03-22','Delivered','New York','USA'),(10,10,6,'2026-03-25','2026-04-02','2026-03-30','Delivered','Berlin','Germany'),(11,1,1,'2026-04-05','2026-04-12','2026-04-08','Delivered','Hyderabad','India'),(12,3,2,'2026-04-17','2026-04-24','2026-04-21','Delivered','Chennai','India'),(13,5,4,'2026-05-01','2026-05-08','2026-05-04','Delivered','Pune','India'),(14,8,2,'2026-05-12','2026-05-18','2026-05-15','Shipped','Hyderabad','India'),(15,9,5,'2026-05-20','2026-05-28',NULL,'Processing','New York','USA'),(16,11,2,'2026-06-02','2026-06-08','2026-06-05','Delivered','Bengaluru','India'),(17,12,3,'2026-06-10','2026-06-17','2026-06-13','Delivered','Noida','India'),(18,4,4,'2026-06-18','2026-06-25',NULL,'Pending','Mumbai','India'),(19,6,3,'2026-07-01','2026-07-07','2026-07-04','Delivered','Delhi','India'),(20,1,1,'2026-07-15','2026-07-22',NULL,'Processing','Hyderabad','India');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `product_name` varchar(150) NOT NULL,
  `category` varchar(100) NOT NULL,
  `subcategory` varchar(100) DEFAULT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `cost_price` decimal(12,2) NOT NULL,
  `stock_quantity` int DEFAULT '0',
  `supplier` varchar(150) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Dell Latitude 5440','Laptops','Business Laptop',85000.00,68000.00,45,'Dell Technologies','2026-09-17 17:09:46'),(2,'HP ProBook 450','Laptops','Business Laptop',72000.00,57000.00,60,'HP India','2026-09-17 17:09:46'),(3,'Lenovo ThinkPad E14','Laptops','Business Laptop',68000.00,53000.00,75,'Lenovo','2026-09-17 17:09:46'),(4,'Apple MacBook Air M3','Laptops','Premium Laptop',115000.00,93000.00,30,'Apple','2026-09-17 17:09:46'),(5,'Samsung Galaxy S24','Smartphones','Premium Smartphone',75000.00,61000.00,80,'Samsung','2026-09-17 17:09:46'),(6,'iPhone 15','Smartphones','Premium Smartphone',70000.00,57000.00,55,'Apple','2026-09-17 17:09:46'),(7,'OnePlus 12','Smartphones','Android Smartphone',65000.00,52000.00,70,'OnePlus','2026-09-17 17:09:46'),(8,'Dell 24 Monitor','Monitors','LED Monitor',18000.00,13000.00,100,'Dell Technologies','2026-09-17 17:09:46'),(9,'LG UltraWide Monitor','Monitors','Ultrawide Monitor',35000.00,27000.00,40,'LG','2026-09-17 17:09:46'),(10,'Logitech MX Master 3S','Accessories','Mouse',8500.00,6000.00,120,'Logitech','2026-09-17 17:09:46'),(11,'Keychron K2 Keyboard','Accessories','Mechanical Keyboard',9500.00,7000.00,90,'Keychron','2026-09-17 17:09:46'),(12,'Sony WH-1000XM5','Audio','Headphones',29000.00,22000.00,65,'Sony','2026-09-17 17:09:46'),(13,'JBL Flip 6','Audio','Bluetooth Speaker',12000.00,8500.00,110,'JBL','2026-09-17 17:09:46'),(14,'Samsung 55 inch QLED TV','Television','Smart TV',85000.00,68000.00,35,'Samsung','2026-09-17 17:09:46'),(15,'LG 65 inch OLED TV','Television','OLED Smart TV',145000.00,115000.00,20,'LG','2026-09-17 17:09:46');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regions`
--

DROP TABLE IF EXISTS `regions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regions` (
  `region_id` int NOT NULL AUTO_INCREMENT,
  `region_name` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`region_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regions`
--

LOCK TABLES `regions` WRITE;
/*!40000 ALTER TABLE `regions` DISABLE KEYS */;
INSERT INTO `regions` VALUES (1,'South India','India','2026-09-17 17:09:46'),(2,'North India','India','2026-09-17 17:09:46'),(3,'West India','India','2026-09-17 17:09:46'),(4,'East India','India','2026-09-17 17:09:46'),(5,'North America','USA','2026-09-17 17:09:46'),(6,'Europe','Germany','2026-09-17 17:09:46');
/*!40000 ALTER TABLE `regions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-18 21:35:46
