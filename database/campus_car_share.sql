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

 Date: 02/12/2025 17:12:55
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for blackroom_records
-- ----------------------------
DROP TABLE IF EXISTS `blackroom_records`;
CREATE TABLE `blackroom_records` (
  `record_id` int NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `enter_count` int DEFAULT '1' COMMENT '第几次进入小黑屋',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '进入原因',
  `enter_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '进入时间',
  `release_time` datetime DEFAULT NULL COMMENT '释放时间（NULL表示永久）',
  `is_permanent` tinyint(1) DEFAULT '0' COMMENT '是否永久封禁',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`record_id`),
  KEY `user_id` (`user_id`),
  KEY `release_time` (`release_time`),
  KEY `idx_blackroom_user_time` (`user_id`,`enter_time` DESC),
  CONSTRAINT `blackroom_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小黑屋记录表';

-- ----------------------------
-- Records of blackroom_records
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `renter_id` int NOT NULL COMMENT '租用者ID',
  `owner_id` int NOT NULL COMMENT '车主ID',
  `hours` int NOT NULL COMMENT '租用时长（小时）',
  `total_fee` decimal(5,2) NOT NULL COMMENT '总费用',
  `status` enum('pending','confirmed','completed','cancelled','waiting_owner_confirm','waiting_renter_confirm') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '订单状态：pending=待确认,confirmed=已确认,completed=已完成,cancelled=已取消,waiting_owner_confirm=等待车主确认完成,waiting_renter_confirm=等待租客确认完成',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `completed_at` datetime DEFAULT NULL COMMENT '完成时间',
  PRIMARY KEY (`order_id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `renter_id` (`renter_id`),
  KEY `owner_id` (`owner_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`renter_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of orders
-- ----------------------------
BEGIN;
INSERT INTO `orders` (`order_id`, `vehicle_id`, `renter_id`, `owner_id`, `hours`, `total_fee`, `status`, `created_at`, `completed_at`) VALUES (1, 4, 8, 4, 2, 10.00, 'cancelled', '2025-12-02 14:32:39', NULL);
INSERT INTO `orders` (`order_id`, `vehicle_id`, `renter_id`, `owner_id`, `hours`, `total_fee`, `status`, `created_at`, `completed_at`) VALUES (2, 4, 8, 4, 2, 10.00, 'cancelled', '2025-12-02 14:45:43', NULL);
INSERT INTO `orders` (`order_id`, `vehicle_id`, `renter_id`, `owner_id`, `hours`, `total_fee`, `status`, `created_at`, `completed_at`) VALUES (3, 4, 8, 4, 2, 10.00, 'completed', '2025-12-02 14:51:38', '2025-12-02 14:59:52');
INSERT INTO `orders` (`order_id`, `vehicle_id`, `renter_id`, `owner_id`, `hours`, `total_fee`, `status`, `created_at`, `completed_at`) VALUES (4, 4, 8, 4, 2, 6.00, 'completed', '2025-12-02 15:16:51', '2025-12-02 15:23:02');
COMMIT;

-- ----------------------------
-- Table structure for post_accepts
-- ----------------------------
DROP TABLE IF EXISTS `post_accepts`;
CREATE TABLE `post_accepts` (
  `accept_id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `accepter_id` int NOT NULL COMMENT '接单者ID',
  `status` enum('pending','accepted','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '接单状态',
  `voucher_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '凭证图片URL',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `completed_at` datetime DEFAULT NULL COMMENT '完成时间',
  PRIMARY KEY (`accept_id`),
  KEY `post_id` (`post_id`),
  KEY `accepter_id` (`accepter_id`),
  CONSTRAINT `post_accepts_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE,
  CONSTRAINT `post_accepts_ibfk_2` FOREIGN KEY (`accepter_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of post_accepts
-- ----------------------------
BEGIN;
INSERT INTO `post_accepts` (`accept_id`, `post_id`, `accepter_id`, `status`, `voucher_url`, `created_at`, `completed_at`) VALUES (1, 1, 8, 'cancelled', NULL, '2025-12-02 14:34:34', NULL);
INSERT INTO `post_accepts` (`accept_id`, `post_id`, `accepter_id`, `status`, `voucher_url`, `created_at`, `completed_at`) VALUES (2, 1, 4, 'completed', NULL, '2025-12-02 15:25:14', '2025-12-02 15:27:34');
INSERT INTO `post_accepts` (`accept_id`, `post_id`, `accepter_id`, `status`, `voucher_url`, `created_at`, `completed_at`) VALUES (3, 2, 4, 'cancelled', NULL, '2025-12-02 15:48:08', NULL);
INSERT INTO `post_accepts` (`accept_id`, `post_id`, `accepter_id`, `status`, `voucher_url`, `created_at`, `completed_at`) VALUES (4, 2, 8, 'completed', NULL, '2025-12-02 15:49:27', '2025-12-02 16:04:53');
COMMIT;

-- ----------------------------
-- Table structure for posts
-- ----------------------------
DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `post_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `type` enum('share','daigou_express','daigou_food') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'share',
  `reward` decimal(5,2) DEFAULT '0.00',
  `pickup_location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deliver_location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `route` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '出行路线（求合租车）',
  `share_time` datetime DEFAULT NULL COMMENT '出行时间（求合租车）',
  `share_person` int DEFAULT NULL COMMENT '可拼人数（求合租车）',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  `is_verified` tinyint(1) DEFAULT '0',
  `status` enum('open','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'open' COMMENT '帖子状态：open=进行中,completed=已完成,cancelled=已取消',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of posts
-- ----------------------------
BEGIN;
INSERT INTO `posts` (`post_id`, `user_id`, `title`, `content`, `type`, `reward`, `pickup_location`, `deliver_location`, `deadline`, `route`, `share_time`, `share_person`, `remark`, `is_verified`, `status`, `created_at`) VALUES (1, 2, '代拿快递', '韵达快递，东门取件', 'daigou_express', 5.00, '东门韵达', '枫林苑3栋512', NULL, NULL, NULL, NULL, NULL, 1, 'cancelled', '2025-11-25 17:46:09');
INSERT INTO `posts` (`post_id`, `user_id`, `title`, `content`, `type`, `reward`, `pickup_location`, `deliver_location`, `deadline`, `route`, `share_time`, `share_person`, `remark`, `is_verified`, `status`, `created_at`) VALUES (2, 2, 'iewkfbweibfeww', '代拿快递：ncew就看风景呃看我从你那里 → 出比微博从我从弄', 'daigou_express', 500.00, 'ncew就看风景呃看我从你那里', '出比微博从我从弄', '2025-12-02 18:02:00', NULL, NULL, NULL, NULL, 1, 'completed', '2025-12-02 15:47:18');
COMMIT;

-- ----------------------------
-- Table structure for reports
-- ----------------------------
DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `report_id` int NOT NULL AUTO_INCREMENT COMMENT '举报ID',
  `reporter_id` int NOT NULL COMMENT '举报人ID',
  `reported_id` int NOT NULL COMMENT '被举报人ID',
  `report_type` enum('order','post','vehicle','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '举报类型：order=订单相关,post=帖子相关,vehicle=车辆相关,other=其他',
  `related_id` int DEFAULT NULL COMMENT '关联ID（订单ID/帖子ID/车辆ID）',
  `reason` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '举报原因',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '详细描述',
  `evidence_urls` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '证据图片URLs（JSON数组）',
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '审核状态：pending=待审核,approved=已通过,rejected=已驳回',
  `admin_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '管理员备注',
  `reviewed_by` int DEFAULT NULL COMMENT '审核管理员ID',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`report_id`),
  KEY `reporter_id` (`reporter_id`),
  KEY `reported_id` (`reported_id`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`),
  KEY `idx_reports_status_created` (`status`,`created_at` DESC),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reported_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户举报表';

-- ----------------------------
-- Records of reports
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '学号',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '手机号',
  `role` enum('student','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'student',
  `report_count` int DEFAULT '0' COMMENT '被举报次数（审核通过）',
  `blackroom_count` int DEFAULT '0' COMMENT '进入小黑屋次数',
  `is_banned` tinyint(1) DEFAULT '0' COMMENT '是否被永久封禁',
  `ban_until` datetime DEFAULT NULL COMMENT '封禁截止时间',
  `is_verified` tinyint(1) DEFAULT '0',
  `status` enum('active','blacklist','banned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `student_id` (`student_id`),
  KEY `idx_users_ban` (`is_banned`,`ban_until`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO `users` (`user_id`, `student_id`, `name`, `password`, `phone`, `role`, `report_count`, `blackroom_count`, `is_banned`, `ban_until`, `is_verified`, `status`) VALUES (1, 'admin', '管理员', 'admin123', '13800138000', 'admin', 0, 0, 0, NULL, 1, 'active');
INSERT INTO `users` (`user_id`, `student_id`, `name`, `password`, `phone`, `role`, `report_count`, `blackroom_count`, `is_banned`, `ban_until`, `is_verified`, `status`) VALUES (2, '20210001', '张三', '123456', '13812345678', 'student', 0, 0, 0, NULL, 1, 'active');
INSERT INTO `users` (`user_id`, `student_id`, `name`, `password`, `phone`, `role`, `report_count`, `blackroom_count`, `is_banned`, `ban_until`, `is_verified`, `status`) VALUES (3, '20210002', '李五', '123456', '13987654321', 'student', 0, 0, 0, NULL, 1, 'active');
INSERT INTO `users` (`user_id`, `student_id`, `name`, `password`, `phone`, `role`, `report_count`, `blackroom_count`, `is_banned`, `ban_until`, `is_verified`, `status`) VALUES (4, '202301005128', '张宇', '123456', '13103587668', 'student', 0, 0, 0, NULL, 1, 'active');
INSERT INTO `users` (`user_id`, `student_id`, `name`, `password`, `phone`, `role`, `report_count`, `blackroom_count`, `is_banned`, `ban_until`, `is_verified`, `status`) VALUES (6, '202301005130', '周脉', '123456', '13533334444', 'student', 0, 0, 0, NULL, 1, 'active');
INSERT INTO `users` (`user_id`, `student_id`, `name`, `password`, `phone`, `role`, `report_count`, `blackroom_count`, `is_banned`, `ban_until`, `is_verified`, `status`) VALUES (7, '202301005121', '123456', '123456', NULL, 'student', 0, 0, 0, NULL, 1, 'active');
INSERT INTO `users` (`user_id`, `student_id`, `name`, `password`, `phone`, `role`, `report_count`, `blackroom_count`, `is_banned`, `ban_until`, `is_verified`, `status`) VALUES (8, '202301005120', '王鹏懿', '12345678', NULL, 'student', 0, 0, 0, NULL, 1, 'active');
COMMIT;

-- ----------------------------
-- Table structure for vehicles
-- ----------------------------
DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
  `vehicle_id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int NOT NULL,
  `plate_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '车牌号',
  `type` enum('bicycle','ebike') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '车辆描述（默认备注）',
  `status` enum('idle','listed','rented') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'idle' COMMENT '车辆状态：闲置、待租用、被租用',
  `location_desc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_per_hour` decimal(5,2) DEFAULT NULL,
  `is_verified` tinyint DEFAULT '0',
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lng` decimal(10,6) DEFAULT NULL,
  `lat` decimal(10,6) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`vehicle_id`),
  KEY `owner_id` (`owner_id`),
  KEY `idx_plate_number` (`plate_number`),
  KEY `idx_status` (`status`),
  CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of vehicles
-- ----------------------------
BEGIN;
INSERT INTO `vehicles` (`vehicle_id`, `owner_id`, `plate_number`, `type`, `description`, `status`, `location_desc`, `price_per_hour`, `is_verified`, `image_url`, `lng`, `lat`, `created_at`) VALUES (4, 4, 'TEST004', 'bicycle', '测试自行车4', 'idle', ' gregbesrhbershbebe (测试自行车4)', 3.00, 1, NULL, 112.589227, 37.799146, '2025-11-25 17:46:09');
INSERT INTO `vehicles` (`vehicle_id`, `owner_id`, `plate_number`, `type`, `description`, `status`, `location_desc`, `price_per_hour`, `is_verified`, `image_url`, `lng`, `lat`, `created_at`) VALUES (5, 4, 'TEST005', 'ebike', '测试电动车5', 'idle', 'sgezgzegzgedgdfhdxhxdfhx', 4.00, 1, NULL, 112.587761, 37.799213, '2025-11-25 17:46:09');
INSERT INTO `vehicles` (`vehicle_id`, `owner_id`, `plate_number`, `type`, `description`, `status`, `location_desc`, `price_per_hour`, `is_verified`, `image_url`, `lng`, `lat`, `created_at`) VALUES (6, 4, '晋A92822', 'ebike', '废话都会变得不到', 'idle', NULL, NULL, 1, NULL, NULL, NULL, '2025-11-25 17:49:07');
INSERT INTO `vehicles` (`vehicle_id`, `owner_id`, `plate_number`, `type`, `description`, `status`, `location_desc`, `price_per_hour`, `is_verified`, `image_url`, `lng`, `lat`, `created_at`) VALUES (7, 4, '晋A92822', 'bicycle', '很多烦恼时', 'idle', NULL, NULL, 1, NULL, NULL, NULL, '2025-11-25 17:51:29');
INSERT INTO `vehicles` (`vehicle_id`, `owner_id`, `plate_number`, `type`, `description`, `status`, `location_desc`, `price_per_hour`, `is_verified`, `image_url`, `lng`, `lat`, `created_at`) VALUES (8, 6, '821671', 'ebike', 'gavcxiaxiabxkbaxwnwwxwx', 'listed', ' i次模拟恩粗暴次啊比比啊 (gavcxiaxiabxkbaxwnwwxwx)', 3.00, 1, NULL, 112.590003, 37.798998, '2025-11-28 21:28:03');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
