USE campus_car_share;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL COMMENT '学号',
    name VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    is_verified BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'blacklist', 'banned') DEFAULT 'active'
);

-- 车辆表
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    type ENUM('bicycle', 'ebike') NOT NULL,
    location_desc VARCHAR(100) NOT NULL CHECK (CHAR_LENGTH(location_desc) >= 5),
    price_per_hour DECIMAL(5,2) NOT NULL CHECK (price_per_hour > 0),
    is_verified BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(255),
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 代拿任务表
CREATE TABLE IF NOT EXISTS posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT,
    type ENUM('share', 'daigou_express', 'daigou_food') DEFAULT 'share',
    reward DECIMAL(5,2) DEFAULT 0,
    pickup_location VARCHAR(100),
    deliver_location VARCHAR(100),
    deadline DATETIME,
    is_verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 测试数据
INSERT IGNORE INTO users (student_id, name, password, role, is_verified) VALUES
('admin', '管理员', 'admin123', 'admin', TRUE),
('20210001', '张三', '123456', 'student', TRUE),
('20210002', '李四', '123456', 'student', FALSE);

INSERT IGNORE INTO vehicles (owner_id, type, location_desc, price_per_hour, is_verified) VALUES
(2, 'ebike', '东区宿舍楼下自行车棚A区3号', 3.00, TRUE),
(2, 'bicycle', '西区教学楼前', 1.50, FALSE);

INSERT IGNORE INTO posts (user_id, title, content, type, reward, pickup_location, deliver_location, is_verified) VALUES
(2, '代拿快递', '韵达快递，东门取件', 'daigou_express', 5.00, '东门韵达', '枫林苑3栋512', FALSE);