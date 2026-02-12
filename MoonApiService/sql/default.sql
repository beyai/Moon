-- MySQL dump 10.13  Distrib 5.7.44, for Linux (aarch64)
--
-- Host: localhost    Database: moon
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
  `mark` varchar(255) DEFAULT '' COMMENT '备注',
  `loginAt` datetime DEFAULT NULL COMMENT '登录时间',
  `loginIp` varchar(255) DEFAULT NULL COMMENT '登录ip',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态 1:正常 0:禁用',
  `version` int(11) unsigned DEFAULT '1' COMMENT '密码版本号',
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
INSERT INTO `admins` VALUES ('9b70ed45-822d-4c64-ac8a-11293647e2b7','system','super','$2b$10$lYA/zYjz7NCt7IL4ww0H7u8gkf1j.0/q/Oh5RvgHkzzMFpA0chpa.','','2026-02-05 04:07:20','未知(127.0.0.1)',1,5,'2025-06-08 04:46:02','2026-02-05 04:01:12');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '记录id',
  `version` varchar(20) NOT NULL COMMENT '版本号',
  `secretKey` varchar(255) NOT NULL COMMENT '密钥',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态 1:正常 0:禁用',
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `version` (`version`),
  KEY `applications_version` (`version`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COMMENT='应用管理';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES (7,'1.0.0','DXvsiyHvzILwLmYfIFg5SINUId8aLnBe1pPy/w8//WU=',1,'2026-02-06 07:08:34'),(8,'1.0.1','iNmnXDW9dst3DiMBHnFl3j1S1BeZ2ucaT+PbgjdFc70=',1,'2026-02-08 21:39:41');
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_actives`
--

DROP TABLE IF EXISTS `device_actives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `device_actives` (
  `activeId` varchar(32) NOT NULL COMMENT '激活ID',
  `deviceCode` varchar(32) NOT NULL COMMENT '设备码',
  `activeAt` datetime NOT NULL COMMENT '激活时间',
  `level` varchar(10) NOT NULL DEFAULT 'medium' COMMENT '激活级别 low:低 medium:中 high:高',
  `expiredAt` datetime NOT NULL COMMENT '过期时间',
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '激活人ID',
  `payment` tinyint(4) DEFAULT '0' COMMENT '结算状态 1:已结算 0:未结算',
  `paymentAt` datetime DEFAULT NULL COMMENT '结算时间',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`activeId`),
  KEY `device_actives_device_code` (`deviceCode`),
  KEY `device_actives_admin_id` (`adminId`),
  KEY `device_actives_payment` (`payment`),
  KEY `device_actives_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
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
  `moveId` varchar(32) NOT NULL COMMENT '移机记录ID',
  `activeId` varchar(32) NOT NULL COMMENT '激活ID',
  `oldDeviceCode` varchar(32) NOT NULL COMMENT '旧设备码',
  `newDeviceCode` varchar(32) NOT NULL COMMENT '新设备码',
  `oldUsername` varchar(30) NOT NULL COMMENT '旧用户名',
  `newUsername` varchar(30) NOT NULL COMMENT '新用户名',
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '移机人ID',
  `payment` tinyint(4) DEFAULT '0' COMMENT '结算状态 1:已结算 0:未结算',
  `paymentAt` datetime DEFAULT NULL COMMENT '结算时间',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`moveId`),
  KEY `device_moves_admin_id` (`adminId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
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
  `paymentId` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `type` varchar(10) NOT NULL DEFAULT 'active' COMMENT '结算类型',
  `total` int(11) NOT NULL DEFAULT '0' COMMENT '总结算数量',
  `count` int(11) NOT NULL DEFAULT '0' COMMENT '当前结算数量',
  `payload` json DEFAULT NULL COMMENT '结算数据',
  `endTime` datetime NOT NULL COMMENT '结算截止日期',
  `paymentAt` datetime DEFAULT NULL COMMENT '结算时间',
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
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
-- Table structure for table `device_sessions`
--

DROP TABLE IF EXISTS `device_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `device_sessions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `deviceUID` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '设备唯一标识',
  `deviceCode` varchar(32) DEFAULT NULL COMMENT '设备码',
  `publicKey` varchar(255) NOT NULL COMMENT '设备公钥',
  `model` varchar(32) DEFAULT NULL COMMENT '设备型号',
  `updatedCount` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '密钥更新次数',
  `status` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '风控状态 0: 删除 1:正常 2:风控中 3:风控栏截',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deviceUID` (`deviceUID`),
  UNIQUE KEY `deviceCode` (`deviceCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_sessions`
--

LOCK TABLES `device_sessions` WRITE;
/*!40000 ALTER TABLE `device_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `device_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `devices` (
  `deviceId` varchar(32) NOT NULL COMMENT '设备ID',
  `deviceUID` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '设备唯一标识',
  `deviceCode` varchar(32) NOT NULL COMMENT '设备码',
  `activeId` varchar(32) DEFAULT NULL COMMENT '激活ID',
  `version` varchar(32) DEFAULT '0.0.0' COMMENT 'App版本号',
  `clientVersion` varchar(32) DEFAULT '0.0.0' COMMENT '客户端版本号',
  `isOnline` tinyint(1) NOT NULL DEFAULT '0' COMMENT '设备是否在线',
  `clientIsOnline` tinyint(1) NOT NULL DEFAULT '0' COMMENT '客户端是否在线',
  `connectedAt` datetime DEFAULT NULL COMMENT '连接时间',
  `disconnectedAt` datetime DEFAULT NULL COMMENT '断开时间',
  `connectedIp` varchar(255) DEFAULT '' COMMENT '连接IP',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态 1:正常 0:禁用',
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '用户ID',
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '管理员ID',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`deviceId`),
  UNIQUE KEY `deviceUID` (`deviceUID`),
  UNIQUE KEY `deviceCode` (`deviceCode`),
  KEY `devices_user_id` (`userId`),
  KEY `devices_admin_id` (`adminId`),
  KEY `devices_active_id` (`activeId`),
  KEY `devices_device_code` (`deviceCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devices`
--

LOCK TABLES `devices` WRITE;
/*!40000 ALTER TABLE `devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_plays`
--

DROP TABLE IF EXISTS `game_plays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `game_plays` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `playId` varchar(32) DEFAULT NULL COMMENT '玩法ID',
  `gameId` int(10) unsigned NOT NULL COMMENT '游戏ID',
  `deviceCode` varchar(32) NOT NULL COMMENT '设备码',
  `name` varchar(32) NOT NULL COMMENT '玩法名称',
  `cutCard` varchar(32) NOT NULL DEFAULT 'not' COMMENT '切牌方式',
  `trick` varchar(32) NOT NULL DEFAULT 'shuffle' COMMENT '手法',
  `isShuffleFull` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否洗全',
  `useCards` varchar(32) NOT NULL DEFAULT '' COMMENT '用牌定制(hex编码)',
  `people` int(11) NOT NULL DEFAULT '2' COMMENT '玩家人数',
  `handCards` int(11) NOT NULL DEFAULT '3' COMMENT '手牌数',
  `score` varchar(32) NOT NULL DEFAULT '' COMMENT '牌面点数(hex编码)',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `playId` (`playId`),
  KEY `game_plays_game_id` (`gameId`),
  KEY `game_plays_device_code` (`deviceCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏玩法';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_plays`
--

LOCK TABLES `game_plays` WRITE;
/*!40000 ALTER TABLE `game_plays` DISABLE KEYS */;
/*!40000 ALTER TABLE `game_plays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `games` (
  `gameId` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '游戏ID',
  `name` varchar(32) NOT NULL DEFAULT '德州' COMMENT '游戏名称',
  `type` varchar(32) NOT NULL DEFAULT 'dezhou' COMMENT '游戏类型',
  `icon` varchar(255) DEFAULT NULL COMMENT '游戏图标',
  `handCards` int(11) NOT NULL DEFAULT '3' COMMENT '手牌数',
  `useCards` varchar(32) NOT NULL COMMENT '用牌定制',
  `status` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '状态',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`gameId`),
  KEY `games_type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COMMENT='游戏';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `games`
--

LOCK TABLES `games` WRITE;
/*!40000 ALTER TABLE `games` DISABLE KEYS */;
INSERT INTO `games` VALUES (1,'德州扑克','dezhou','http://192.168.3.100:7001/public/icon/1.png',5,'ffffffffffff0f',1,'2026-02-06 06:00:59','2026-02-07 08:49:10'),(2,'金花','jinhua','http://192.168.3.100:7001/public/icon/2.png',3,'ffffffffffff0f',1,'2026-02-06 06:36:11','2026-02-08 21:02:21'),(3,'三公','sangong','http://192.168.3.100:7001/public/icon/3.png',3,'ffffffffffff0f',1,'2026-02-06 06:36:28','2026-02-07 08:49:26'),(4,'百家乐','baijiale','http://192.168.3.100:7001/public/icon/4.png',3,'ffe37ffc8fff01',1,'2026-02-06 06:37:48','2026-02-07 08:49:30');
/*!40000 ALTER TABLE `games` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '用户ID',
  `username` varchar(30) NOT NULL COMMENT '用户名',
  `password` varchar(128) NOT NULL COMMENT '密码',
  `isOnline` tinyint(1) NOT NULL DEFAULT '0' COMMENT '在线状态',
  `loginAt` datetime DEFAULT NULL COMMENT '登录时间',
  `loginIp` varchar(255) DEFAULT '' COMMENT '登录IP',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态 1:正常 0:禁用',
  `version` int(10) unsigned NOT NULL DEFAULT '1' COMMENT '密码修改统计',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'moon'
--

--
-- Dumping routines for database 'moon'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-09 20:35:56
