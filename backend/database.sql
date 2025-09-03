-- Team Tool - Database Schema
--
-- This script creates the database structure for the Team Tool application.
--

-- Enable foreign key checks
-- SET FOREIGN_KEY_CHECKS=1; -- Let's disable this temporarily to make dropping easier

SET FOREIGN_KEY_CHECKS=0;

--
--
-- Table structure for table `roles`
--
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO `roles` (name, description) VALUES
('admin', 'Administrator with full system access'),
('manager', 'Manager of a team or project'),
('member', 'Regular user member');

--
-- Table structure for table `users`
--
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `teams`
--
CREATE TABLE `teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `team_members`
--
CREATE TABLE `team_members` (
  `user_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `role` enum('admin', 'member') NOT NULL DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`team_id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `team_members_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_members_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `projects`
--
CREATE TABLE `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `team_id` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `pic_id` INT(11) NULL,
  `status` enum('planning','in_progress','completed','on_hold') NOT NULL DEFAULT 'planning',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `team_id` (`team_id`),
  KEY `created_by` (`created_by`),
  KEY `pic_id_idx` (`pic_id`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `projects_ibfk_3` FOREIGN KEY (`pic_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `tasks`
--
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `project_id` int(11) NOT NULL,
  `assignee_id` int(11) DEFAULT NULL,
  `reporter_id` int(11) NOT NULL,
  `due_date` date DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `status` enum('todo','in_progress','in_review','done') NOT NULL DEFAULT 'todo',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `project_id` (`project_id`),
  KEY `assignee_id` (`assignee_id`),
  KEY `reporter_id` (`reporter_id`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tasks_ibfk_3` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- =================================================================
-- Chat Feature Tables
-- =================================================================
--

--
-- Table structure for table `conversations`
--
CREATE TABLE `conversations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `uuid` VARCHAR(36) NOT NULL UNIQUE,
    `type` ENUM('dm', 'group') NOT NULL,
    `team_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `team_id_idx` (`team_id`),
    CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `conversation_participants`
--
CREATE TABLE `conversation_participants` (
    `conversation_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`conversation_id`, `user_id`),
    CONSTRAINT `conv_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
    CONSTRAINT `conv_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `messages`
--
CREATE TABLE `messages` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `uuid` VARCHAR(36) NOT NULL UNIQUE,
    `conversation_id` INT NOT NULL,
    `sender_id` INT NOT NULL,
    `content` TEXT NOT NULL COMMENT 'Encrypted message content',
    `iv` VARCHAR(255) NOT NULL COMMENT 'Initialization Vector for AES',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY `conversation_id_idx` (`conversation_id`),
    CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
    CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Table structure for table `mentions`
--
CREATE TABLE `mentions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `message_id` BIGINT NOT NULL,
    `mention_type` ENUM('task', 'project') NOT NULL,
    `mentioned_task_id` INT NULL,
    `mentioned_project_id` INT NULL,
    KEY `message_id_idx` (`message_id`),
    CONSTRAINT `mentions_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
    CONSTRAINT `mentions_ibfk_2` FOREIGN KEY (`mentioned_task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
    CONSTRAINT `mentions_ibfk_3` FOREIGN KEY (`mentioned_project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `knowledge_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(36) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `link` VARCHAR(2048) NOT NULL,
  `description` TEXT NULL,
  `created_by_id` INT NOT NULL,
  `assignee_id` INT NULL,
  `status` ENUM('pending', 'done') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_knowledge_created_by` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_knowledge_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- Seeding a default manager user
-- Password is 'password123'
--
SET FOREIGN_KEY_CHECKS=1;

--
-- Table structure for table `project_members`
--
CREATE TABLE `project_members` (
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `role` enum('manager','member') NOT NULL DEFAULT 'member',
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`project_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_members_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_members_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `tasks`
ADD COLUMN `parent_task_id` INT NULL DEFAULT NULL AFTER `project_id`,
ADD CONSTRAINT `fk_tasks_parent` FOREIGN KEY (`parent_task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

-- New table for GA4 Settings, linked to a team
CREATE TABLE ga4_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL UNIQUE, -- Each team can only have one GA4 configuration
    ga4_property_id VARCHAR(255) NOT NULL,
    measurement_id VARCHAR(255),
    api_secret_encrypted TEXT,
    service_account_credentials_encrypted TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE `work_locations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `radius` INT NOT NULL COMMENT 'Allowable radius in meters',
  PRIMARY KEY (`id`)
);

CREATE TABLE `attendance` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `work_location_id` INT NOT NULL,
  `clock_in_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `clock_out_time` TIMESTAMP NULL,
  `status` ENUM('ON_TIME', 'LATE') NOT NULL,
  `work_date` DATE NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_work_date` (`user_id`, `work_date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`work_location_id`) REFERENCES `work_locations`(`id`) ON DELETE RESTRICT
);

-- Bảng để lưu các yêu cầu nghỉ phép và ngoài văn phòng
CREATE TABLE `leave_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `request_type` ENUM('LEAVE', 'OUT_OF_OFFICE') NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `reason` TEXT,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Bảng để lưu các yêu cầu thanh toán
CREATE TABLE `payment_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'VND',
  `description` TEXT NOT NULL,
  `receipt_url` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Bảng lưu các chi tiết của một dự án, sẽ được refactor thành "templates"
-- CREATE TABLE project_details (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     project_id INT NOT NULL UNIQUE,
--     product_info TEXT,
--     platform_accounts TEXT,
--     image_folder_link VARCHAR(255),
--     brand_guideline_link VARCHAR(255),
--     customer_notes TEXT,
--     kpis TEXT,
--     personnel_count INT,
--     personnel_levels TEXT,
--     content_strategy TEXT,
--     website_page_count INT,
--     keywords_plan JSON,
--     cluster_model TEXT,
--     internal_link_plan TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
-- );

-- START: TEMPLATE FEATURE TABLES
CREATE TABLE
  `templates` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `description` text,
    `created_by` int NOT NULL,
    `product_info` text,
    `platform_accounts` text,
    `image_folder_link` varchar(255) DEFAULT NULL,
    `brand_guideline_link` varchar(255) DEFAULT NULL,
    `customer_notes` text,
    `kpis` text,
    `personnel_count` int DEFAULT NULL,
    `personnel_levels` text,
    `content_strategy` text,
    `website_page_count` int DEFAULT NULL,
    `keywords_plan` json DEFAULT NULL,
    `cluster_model` text,
    `internal_link_plan` text,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `created_by` (`created_by`),
    CONSTRAINT `templates_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
  );

CREATE TABLE
  `template_projects` (
    `id` int NOT NULL AUTO_INCREMENT,
    `template_id` int NOT NULL,
    `project_name_template` varchar(255) NOT NULL,
    `project_description_template` text,
    `start_day` int NOT NULL DEFAULT '0' COMMENT 'Relative start day from the beginning of the template process',
    `duration_days` int NOT NULL DEFAULT '1' COMMENT 'Duration of the project in days',
    PRIMARY KEY (`id`),
    KEY `template_id` (`template_id`),
    CONSTRAINT `template_projects_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
  );

CREATE TABLE
  `template_tasks` (
    `id` int NOT NULL AUTO_INCREMENT,
    `template_project_id` int NOT NULL,
    `task_name_template` varchar(255) NOT NULL,
    `task_description_template` text,
    `start_day` int NOT NULL DEFAULT '0' COMMENT 'Relative start day from the beginning of the parent project',
    `duration_days` int NOT NULL DEFAULT '1' COMMENT 'Duration of the task in days',
    PRIMARY KEY (`id`),
    KEY `template_project_id` (`template_project_id`),
    CONSTRAINT `template_tasks_ibfk_1` FOREIGN KEY (`template_project_id`) REFERENCES `template_projects` (`id`) ON DELETE CASCADE
  );

CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng lưu các câu hỏi cho mỗi bài kiểm tra
CREATE TABLE quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    -- 'single-choice' hoặc 'multiple-choice'
    question_type VARCHAR(50) NOT NULL DEFAULT 'single-choice',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Bảng lưu các phương án trả lời cho mỗi câu hỏi
CREATE TABLE question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);

-- Bảng theo dõi việc giao bài và kết quả của thành viên
CREATE TABLE quiz_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_by_id INT,
    due_date TIMESTAMP NULL DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    score INT,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(quiz_id, user_id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by_id) REFERENCES users(id) ON DELETE SET NULL
);
-- Indexes for performance
CREATE INDEX idx_team_uuid ON teams(uuid);
CREATE INDEX idx_tm_team_id ON team_members(team_id);
CREATE INDEX idx_tm_user_id ON team_members(user_id);

-- Bảng lưu trữ các cuộc họp/sự kiện
CREATE TABLE `meetings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meeting_type` enum('online', 'offline', 'hybrid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'online',
  `meeting_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Link Zoom/Teams/Google Meet',
  `organizer_id` int NOT NULL,
  `status` enum('scheduled', 'ongoing', 'completed', 'cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#3B82F6' COMMENT 'Màu hiển thị trên lịch (hex)',
  `is_recurring` boolean DEFAULT FALSE,
  `recurring_pattern` json DEFAULT NULL COMMENT 'Thông tin lặp lại: frequency, interval, days, etc.',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `organizer_id` (`organizer_id`),
  KEY `start_time_idx` (`start_time`),
  KEY `status_idx` (`status`),
  CONSTRAINT `meetings_ibfk_1` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng lưu trữ người tham gia cuộc họp
CREATE TABLE `meeting_participants` (
  `meeting_id` int NOT NULL,
  `user_id` int NOT NULL,
  `response_status` enum('pending', 'accepted', 'declined', 'tentative') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `is_required` boolean DEFAULT TRUE COMMENT 'Người tham gia bắt buộc hay tùy chọn',
  `joined_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`meeting_id`, `user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `meeting_participants_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `meeting_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng lưu trữ nhắc nhở cuộc họp
CREATE TABLE `meeting_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `meeting_id` int NOT NULL,
  `user_id` int NOT NULL,
  `reminder_time` datetime NOT NULL,
  `reminder_type` enum('email', 'notification', 'sms') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'notification',
  `is_sent` boolean DEFAULT FALSE,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `meeting_id` (`meeting_id`),
  KEY `user_id` (`user_id`),
  KEY `reminder_time_idx` (`reminder_time`),
  CONSTRAINT `meeting_reminders_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `meeting_reminders_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================================================
-- NOTIFICATION SYSTEM DATABASE SCHEMA (Fixed Version)
-- ==================================================

-- 1. Bảng notification_types - Lưu trữ các loại thông báo
CREATE TABLE IF NOT EXISTS notification_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thêm dữ liệu mẫu cho notification_types
INSERT IGNORE INTO notification_types (type_name, description) VALUES
('message', 'New message notification'),
('mention', 'User mentioned in a message'),
('task_assigned', 'Task assigned to user'),
('project_assigned', 'Project assigned to user or team'),
('quiz_assigned', 'Quiz assigned to user'),
('meeting_reminder', 'Meeting reminder notification'),
('team_added', 'User added to team'),
('task_updated', 'Task status updated'),
('project_updated', 'Project status updated');

-- 2. Bảng chính notifications - Lưu trữ thông báo
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    metadata JSON DEFAULT NULL,
    action_url VARCHAR(500) DEFAULT NULL,
    sender_id INT DEFAULT NULL,
    expires_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (type_id) REFERENCES notification_types(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_type_id (type_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at)
);

-- 3. Bảng notification_recipients - Quản lý người nhận và trạng thái đã đọc
CREATE TABLE IF NOT EXISTS notification_recipients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notification_id INT NOT NULL,
    user_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_notification_user (notification_id, user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_notification_id (notification_id),
    INDEX idx_is_read (is_read),
    INDEX idx_user_read (user_id, is_read)
);

-- 4. Bảng user_notification_settings - Cài đặt thông báo của user
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    notification_type_id INT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_type_id) REFERENCES notification_types(id) ON DELETE CASCADE,

    UNIQUE KEY unique_user_type (user_id, notification_type_id),
    INDEX idx_user_id (user_id),
    INDEX idx_notification_type_id (notification_type_id)
);

-- 5. View để query thông báo của user một cách tối ưu
DROP VIEW IF EXISTS user_notifications_view;
CREATE VIEW user_notifications_view AS
SELECT
    n.id,
    n.title,
    n.content,
    n.metadata,
    n.action_url,
    n.created_at,
    n.expires_at,
    nt.type_name,
    nt.description as type_description,
    nr.user_id,
    nr.is_read,
    nr.read_at,
    u.full_name as sender_name,
    u.avatar_url as sender_avatar
FROM notifications n
JOIN notification_types nt ON n.type_id = nt.id
JOIN notification_recipients nr ON n.id = nr.notification_id
LEFT JOIN users u ON n.sender_id = u.id
WHERE (n.expires_at IS NULL OR n.expires_at > NOW());

-- ==================================================
-- NOTIFICATION STORED PROCEDURES AND FUNCTIONS
-- ==================================================

-- Stored Procedure để tạo thông báo cho nhiều user
DROP PROCEDURE IF EXISTS CreateNotificationForUsers;

DELIMITER //

CREATE PROCEDURE CreateNotificationForUsers(
    IN p_type_name VARCHAR(50),
    IN p_title VARCHAR(255),
    IN p_content TEXT,
    IN p_action_url VARCHAR(500),
    IN p_metadata JSON,
    IN p_sender_id INT,
    IN p_user_ids JSON,
    IN p_expires_at TIMESTAMP
)
BEGIN
    DECLARE v_type_id INT;
    DECLARE v_notification_id INT;
    DECLARE v_user_id INT;
    DECLARE v_index INT DEFAULT 0;
    DECLARE v_count INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Lấy type_id từ type_name
    SELECT id INTO v_type_id FROM notification_types WHERE type_name = p_type_name;

    IF v_type_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid notification type';
    END IF;

    -- Tạo notification
    INSERT INTO notifications (type_id, title, content, metadata, action_url, sender_id, expires_at)
    VALUES (v_type_id, p_title, p_content, p_metadata, p_action_url, p_sender_id, p_expires_at);

    SET v_notification_id = LAST_INSERT_ID();

    -- Lấy số lượng user_ids
    SET v_count = JSON_LENGTH(p_user_ids);

    -- Thêm recipients
    WHILE v_index < v_count DO
        SET v_user_id = JSON_UNQUOTE(JSON_EXTRACT(p_user_ids, CONCAT('$[', v_index, ']')));

        INSERT INTO notification_recipients (notification_id, user_id)
        VALUES (v_notification_id, v_user_id);

        SET v_index = v_index + 1;
    END WHILE;

    COMMIT;

    SELECT v_notification_id as notification_id;
END //

DELIMITER ;

-- Function để lấy số lượng thông báo chưa đọc
DROP FUNCTION IF EXISTS GetUnreadNotificationCount;

DELIMITER //

CREATE FUNCTION GetUnreadNotificationCount(p_user_id INT)
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_count INT;

    SELECT COUNT(*) INTO v_count
    FROM notification_recipients nr
    JOIN notifications n ON nr.notification_id = n.id
    WHERE nr.user_id = p_user_id
    AND nr.is_read = FALSE
    AND (n.expires_at IS NULL OR n.expires_at > NOW());

    RETURN v_count;
END //

DELIMITER ;

INSERT IGNORE INTO notification_types (type_name, description) VALUES ('meeting_invited', 'User invited to a meeting');

-- Index để tối ưu hiệu suất
CREATE INDEX idx_meetings_date_range ON meetings(start_time, end_time);
CREATE INDEX idx_meetings_organizer_status ON meetings(organizer_id, status);
CREATE INDEX idx_participants_response ON meeting_participants(response_status);

-- Insert default work location
INSERT INTO work_locations (name, latitude, longitude, radius)
VALUES ('Công ty TNHH Giải pháp TIEN ZIVEN', 10.7981586, 106.6781134, 100);
ALTER TABLE work_locations
ADD COLUMN address VARCHAR(255) NOT NULL AFTER name;

--
-- Table structure for table `project_details`
--
CREATE TABLE `project_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `project_id` INT NOT NULL,
  `product_info` TEXT,
  `platform_accounts` TEXT,
  `image_folder_link` VARCHAR(255),
  `brand_guideline_link` VARCHAR(255),
  `customer_notes` TEXT,
  `kpis` TEXT,
  `personnel_count` INT,
  `personnel_levels` VARCHAR(255),
  `content_strategy` TEXT,
  `website_page_count` INT,
  `cluster_model` TEXT,
  `internal_link_plan` TEXT,
  `keywords_plan` JSON,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id_unique` (`project_id`),
  CONSTRAINT `fk_project_details_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;