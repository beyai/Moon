-- MySQL dump 10.13  Distrib 5.7.44, for Linux (aarch64)
--
-- Host: localhost    Database: egg
-- ------------------------------------------------------
-- Server version	5.7.44-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admins` (
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '管理员id',
  `type` varchar(10) NOT NULL DEFAULT 'agent' COMMENT '管理员类型 system:系统管理员 agent:普通管理员',
  `username` varchar(30) NOT NULL COMMENT '用户名',
  `password` varchar(128) NOT NULL COMMENT '密码',
  `loginAt` datetime DEFAULT NULL COMMENT '登录时间',
  `loginIp` varchar(16) DEFAULT NULL COMMENT '登录ip',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态 1:正常 0:禁用',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`adminId`),
  UNIQUE KEY `username` (`username`),
  KEY `admins_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES ('9b70ed45-822d-4c64-ac8a-11293647e2b7','system','super','$2b$10$fD2QJ14TeHKTwjZCyjGFSO0jHXcuCUEC4IVrN.7mpVp3IAQA2CmgW','2025-08-05 23:17:51','192.168.5.64',1,'2025-06-08 04:46:02','2025-06-08 04:46:02');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_actives`
--

DROP TABLE IF EXISTS `device_actives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `device_actives` (
  `activeId` varchar(32) NOT NULL COMMENT '激活记录id',
  `deviceCode` varchar(32) NOT NULL COMMENT '设备编号',
  `activeAt` datetime DEFAULT NULL COMMENT '激活时间',
  `level` varchar(10) NOT NULL DEFAULT 'medium' COMMENT '激活级别 low:低 medium:中 high:高',
  `expiredAt` datetime DEFAULT NULL COMMENT '过期时间',
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '操作员id',
  `payment` tinyint(4) NOT NULL DEFAULT '0' COMMENT '结算状态 1:已结算 0:未结算',
  `paymentAt` datetime DEFAULT NULL COMMENT '结算时间',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`activeId`),
  KEY `device_actives_device_code` (`deviceCode`),
  KEY `device_actives_admin_id` (`adminId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='激活记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_actives`
--

LOCK TABLES `device_actives` WRITE;
/*!40000 ALTER TABLE `device_actives` DISABLE KEYS */;
/*!40000 ALTER TABLE `device_actives` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_moves`
--

DROP TABLE IF EXISTS `device_moves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `device_moves` (
  `moveId` varchar(32) NOT NULL COMMENT '移机记录id',
  `activeId` varchar(32) NOT NULL COMMENT '激活记录id',
  `oldDeviceCode` varchar(32) NOT NULL COMMENT '旧设备编号',
  `newDeviceCode` varchar(32) NOT NULL COMMENT '新设备编号',
  `oldUsername` varchar(30) NOT NULL COMMENT '旧用户名',
  `newUsername` varchar(30) NOT NULL COMMENT '新用户名',
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '操作员id',
  `payment` tinyint(4) NOT NULL DEFAULT '0' COMMENT '结算状态 1:已结算 0:未结算',
  `paymentAt` datetime DEFAULT NULL COMMENT '结算时间',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`moveId`),
  KEY `device_moves_admin_id` (`adminId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='移机记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_moves`
--

LOCK TABLES `device_moves` WRITE;
/*!40000 ALTER TABLE `device_moves` DISABLE KEYS */;
/*!40000 ALTER TABLE `device_moves` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_payments`
--

DROP TABLE IF EXISTS `device_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `device_payments` (
  `paymentId` int(11) NOT NULL AUTO_INCREMENT COMMENT '结算记录id',
  `type` varchar(10) NOT NULL DEFAULT 'active' COMMENT '结算类型 active:激活 move:移机',
  `total` int(11) NOT NULL DEFAULT '0' COMMENT '总结算数量',
  `count` int(11) NOT NULL DEFAULT '0' COMMENT '当前结算数量',
  `payload` json DEFAULT NULL COMMENT '结算数据',
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '操作员id',
  `endTime` datetime NOT NULL COMMENT '结算截止日期',
  `paymentAt` datetime DEFAULT NULL COMMENT '结算时间',
  PRIMARY KEY (`paymentId`),
  KEY `device_payments_type` (`type`),
  KEY `device_payments_admin_id` (`adminId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='激活记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_payments`
--

LOCK TABLES `device_payments` WRITE;
/*!40000 ALTER TABLE `device_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `device_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `devices` (
  `deviceId` varchar(32) NOT NULL COMMENT '设备id',
  `deviceCode` varchar(32) NOT NULL COMMENT '设备编号',
  `activeId` varchar(32) DEFAULT NULL COMMENT '激活id',
  `isOnline` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否在线',
  `connectedAt` datetime DEFAULT NULL COMMENT '连接时间',
  `disconnectedAt` datetime DEFAULT NULL COMMENT '断开时间',
  `connectedIp` varchar(16) DEFAULT NULL COMMENT '连接ip',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态 1:正常 0:禁用',
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '用户id',
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '管理员id',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`deviceId`),
  UNIQUE KEY `deviceCode` (`deviceCode`),
  KEY `devices_user_id` (`userId`),
  KEY `devices_admin_id` (`adminId`),
  KEY `devices_device_code` (`deviceCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devices`
--

LOCK TABLES `devices` WRITE;
/*!40000 ALTER TABLE `devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '用户id',
  `username` varchar(30) NOT NULL COMMENT '用户名',
  `password` varchar(128) NOT NULL COMMENT '密码',
  `isOnline` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否在线',
  `loginAt` datetime DEFAULT NULL COMMENT '登录时间',
  `loginIp` varchar(16) DEFAULT NULL COMMENT '登录ip',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态 1:正常 0:禁用',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'egg'
--

--
-- Dumping routines for database 'egg'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-05 23:18:16
