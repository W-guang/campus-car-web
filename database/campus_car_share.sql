/*
 Navicat Premium Dump SQL

 Source Server         : localhost_root
 Source Server Type    : MySQL
 Source Server Version : 80044 (8.0.44)
 Source Host           : localhost:3306
 Source Schema         : campus_car_share

 Target Server Type    : MySQL
 Target Server Version : 80044 (8.0.44)
 File Encoding         : 65001

 Date: 17/11/2025 20:13:30
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for posts
-- ----------------------------
DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `post_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `type` enum('share','daigou_express','daigou_food') COLLATE utf8mb4_unicode_ci DEFAULT 'share',
  `reward` decimal(5,2) DEFAULT '0.00',
  `pickup_location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deliver_location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of posts
-- ----------------------------
BEGIN;
INSERT INTO `posts` (`post_id`, `user_id`, `title`, `content`, `type`, `reward`, `pickup_location`, `deliver_location`, `deadline`, `is_verified`) VALUES (1, 2, '代拿快递', '韵达快递，东门取件', 'daigou_express', 5.00, '东门韵达', '枫林苑3栋512', NULL, 1);
COMMIT;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '学号',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('student','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'student',
  `is_verified` tinyint(1) DEFAULT '0',
  `status` enum('active','blacklist','banned') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO `users` (`user_id`, `student_id`, `name`, `password`, `role`, `is_verified`, `status`) VALUES (1, 'admin', '管理员', 'admin123', 'admin', 1, 'active');
INSERT INTO `users` (`user_id`, `student_id`, `name`, `password`, `role`, `is_verified`, `status`) VALUES (2, '20210001', '张三', '123456', 'student', 1, 'active');
INSERT INTO `users` (`user_id`, `student_id`, `name`, `password`, `role`, `is_verified`, `status`) VALUES (3, '20210002', '李五', '123456', 'student', 1, 'active');
INSERT INTO `users` (`user_id`, `student_id`, `name`, `password`, `role`, `is_verified`, `status`) VALUES (4, '202301005128', '张宇', '123456', 'student', 1, 'active');
INSERT INTO `users` (`user_id`, `student_id`, `name`, `password`, `role`, `is_verified`, `status`) VALUES (6, '202301005130', '周脉', '123456', 'student', 1, 'active');
COMMIT;

-- ----------------------------
-- Table structure for vehicles
-- ----------------------------
DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
  `vehicle_id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int NOT NULL,
  `type` enum('bicycle','ebike') COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_desc` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_per_hour` decimal(5,2) NOT NULL,
  `is_verified` tinyint DEFAULT '0',
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lng` decimal(10,6) DEFAULT NULL,
  `lat` decimal(10,6) DEFAULT NULL,
  PRIMARY KEY (`vehicle_id`),
  KEY `owner_id` (`owner_id`),
  CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `vehicles_chk_1` CHECK ((char_length(`location_desc`) >= 5)),
  CONSTRAINT `vehicles_chk_2` CHECK ((`price_per_hour` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of vehicles
-- ----------------------------
BEGIN;
INSERT INTO `vehicles` (`vehicle_id`, `owner_id`, `type`, `location_desc`, `price_per_hour`, `is_verified`, `image_url`, `lng`, `lat`) VALUES (1, 2, 'ebike', '东区宿舍楼下自行车棚A区3号', 3.00, -1, NULL, NULL, NULL);
INSERT INTO `vehicles` (`vehicle_id`, `owner_id`, `type`, `location_desc`, `price_per_hour`, `is_verified`, `image_url`, `lng`, `lat`) VALUES (2, 2, 'bicycle', '西区教学楼前', 1.50, -1, NULL, NULL, NULL);
INSERT INTO `vehicles` (`vehicle_id`, `owner_id`, `type`, `location_desc`, `price_per_hour`, `is_verified`, `image_url`, `lng`, `lat`) VALUES (3, 2, 'bicycle', ' 饿个帅哥帅哥各', 2.00, 1, NULL, 112.586795, 37.796789);
INSERT INTO `vehicles` (`vehicle_id`, `owner_id`, `type`, `location_desc`, `price_per_hour`, `is_verified`, `image_url`, `lng`, `lat`) VALUES (4, 4, 'bicycle', ' segesgsegesgsegsgse', 4.50, 1, NULL, 112.588147, 37.797145);
INSERT INTO `vehicles` (`vehicle_id`, `owner_id`, `type`, `location_desc`, `price_per_hour`, `is_verified`, `image_url`, `lng`, `lat`) VALUES (5, 4, 'ebike', ' sgezgzegzgedgdfhdxhxdfhx', 4.00, 1, NULL, 112.587761, 37.799213);
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
