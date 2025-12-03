-- 校园车辆管理系统 - 完整数据库迁移脚本
-- 包含：订单双方确认、帖子完成状态、举报与安全系统
-- 执行时间：需要在修改代码前运行
-- 作者：系统管理员
-- 日期：2024年12月2日

USE campus_car_share;

-- ==================== 第一部分：订单双方确认机制 ====================

-- 1. 修改orders表的status字段，添加等待确认的状态
ALTER TABLE `orders` 
MODIFY COLUMN `status` 
ENUM('pending','confirmed','completed','cancelled','waiting_owner_confirm','waiting_renter_confirm') 
COLLATE utf8mb4_unicode_ci DEFAULT 'pending' 
COMMENT '订单状态：pending=待确认,confirmed=已确认,completed=已完成,cancelled=已取消,waiting_owner_confirm=等待车主确认完成,waiting_renter_confirm=等待租客确认完成';

-- ==================== 第二部分：帖子完成状态管理 ====================

-- 2. 给posts表添加status字段
ALTER TABLE `posts` 
ADD COLUMN `status` ENUM('open', 'completed', 'cancelled') 
COLLATE utf8mb4_unicode_ci DEFAULT 'open' 
COMMENT '帖子状态：open=进行中,completed=已完成,cancelled=已取消'
AFTER `is_verified`;

-- ==================== 第三部分：举报与安全系统 ====================

-- 3. 创建举报表
CREATE TABLE IF NOT EXISTS `reports` (
  `report_id` int NOT NULL AUTO_INCREMENT COMMENT '举报ID',
  `reporter_id` int NOT NULL COMMENT '举报人ID',
  `reported_id` int NOT NULL COMMENT '被举报人ID',
  `report_type` enum('order','post','vehicle','other') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '举报类型',
  `related_id` int DEFAULT NULL COMMENT '关联ID（订单ID/帖子ID/车辆ID）',
  `reason` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '举报原因',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '详细描述',
  `evidence_urls` text COLLATE utf8mb4_unicode_ci COMMENT '证据图片URLs（JSON数组）',
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '审核状态',
  `admin_note` text COLLATE utf8mb4_unicode_ci COMMENT '管理员备注',
  `reviewed_by` int DEFAULT NULL COMMENT '审核管理员ID',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`report_id`),
  KEY `idx_reporter` (`reporter_id`),
  KEY `idx_reported` (`reported_id`),
  KEY `idx_status_created` (`status`, `created_at` DESC),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reported_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户举报表';

-- 4. 创建小黑屋记录表
CREATE TABLE IF NOT EXISTS `blackroom_records` (
  `record_id` int NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `enter_count` int DEFAULT 1 COMMENT '第几次进入小黑屋',
  `reason` text COLLATE utf8mb4_unicode_ci COMMENT '进入原因',
  `enter_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '进入时间',
  `release_time` datetime DEFAULT NULL COMMENT '释放时间（NULL表示永久）',
  `is_permanent` tinyint(1) DEFAULT 0 COMMENT '是否永久封禁',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`record_id`),
  KEY `idx_user_time` (`user_id`, `enter_time` DESC),
  CONSTRAINT `blackroom_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小黑屋记录表';

-- 5. 给users表添加信用相关字段
ALTER TABLE `users` 
ADD COLUMN `report_count` int DEFAULT 0 COMMENT '被举报次数（审核通过）' AFTER `role`,
ADD COLUMN `blackroom_count` int DEFAULT 0 COMMENT '进入小黑屋次数' AFTER `report_count`,
ADD COLUMN `is_banned` tinyint(1) DEFAULT 0 COMMENT '是否被永久封禁' AFTER `blackroom_count`,
ADD COLUMN `ban_until` datetime DEFAULT NULL COMMENT '封禁截止时间' AFTER `is_banned`;

-- 6. 创建性能优化索引
CREATE INDEX IF NOT EXISTS idx_users_ban ON users(is_banned, ban_until);

-- ==================== 验证与说明 ====================

-- 验证orders表修改
SELECT COLUMN_TYPE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'campus_car_share' 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'status';

-- 验证posts表修改
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'campus_car_share' 
  AND TABLE_NAME = 'posts' 
  AND COLUMN_NAME = 'status';

-- 验证举报表
SHOW TABLES LIKE 'reports';

-- 验证小黑屋表
SHOW TABLES LIKE 'blackroom_records';

-- 验证users表新字段
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'campus_car_share' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME IN ('report_count', 'blackroom_count', 'is_banned', 'ban_until');

-- ==================== 功能说明 ====================
-- 
-- 【订单双方确认机制】
-- - 租客或车主任一方点击完成 → 状态变为 waiting_owner_confirm 或 waiting_renter_confirm
-- - 另一方确认完成 → 状态变为 completed，车辆状态变为 idle
-- - 需要双方确认，避免单方面结束订单
--
-- 【帖子完成状态】
-- - 发布帖子时 status = 'open'
-- - 接单完成后 status = 'completed'，论坛列表不再显示
-- - 防止已完成的帖子继续被接单
--
-- 【举报与安全系统】
-- - 用户可举报不当行为，提交证据
-- - 管理员审核，防止恶意举报
-- - 被举报5次 → 进入小黑屋（禁止上架车辆和发帖7天）
-- - 第3次进入小黑屋 → 永久封禁
-- - 黑名单显示时隐私保护（学号前4位+****，姓名首字+*）
--
-- ==================== 执行完成 ====================

SELECT '✅ 数据库迁移完成！' as 状态,
       '订单双方确认 + 帖子完成状态 + 举报系统' as 功能,
       NOW() as 执行时间;
