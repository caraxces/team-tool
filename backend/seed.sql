-- =================================================================
-- Team-Tool Seed Data
-- =================================================================
-- This file contains sample data for the entire application.
-- WARNING: This script will DELETE all existing data in the specified
-- tables before inserting new data.
-- =================================================================

-- Temporarily disable foreign key checks to allow truncation of tables.
SET FOREIGN_KEY_CHECKS=0;

-- Truncate tables to clear all data and reset auto-increment counters.
-- Order matters for clarity, but not strictly required with checks disabled.
TRUNCATE TABLE `template_tasks`;
TRUNCATE TABLE `template_projects`;
TRUNCATE TABLE `templates`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `roles`;

-- Re-enable foreign key checks. From now on, all constraints are active.
SET FOREIGN_KEY_CHECKS=1;

-- =================================================================
-- Insert Roles
-- =================================================================
-- The IDs are explicitly set to ensure consistency when assigning roles to users.
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'Admin', 'Has all permissions to manage the system.'),
(2, 'Project Manager', 'Manages projects and teams.'),
(3, 'Team Lead', 'Leads a team and oversees tasks.'),
(4, 'Member', 'A regular team member participating in projects.'),
(5, 'Client', 'An external user with view-only permissions.');

-- =================================================================
-- Insert Users
-- =================================================================
-- The password for all users is 'password123'.
-- The value below is the bcrypt hash for 'password123', which your backend uses.
-- You can use the admin user to log in.
INSERT INTO `users` (`uuid`, `email`, `password`, `full_name`, `role_id`) VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'admin@example.com', '$2a$10$dRMp.qV.e8r.tY.uI.oP.e.aBcDeFgHiJkLmNoPqRsTuVwXyZ', 'Admin User', 1),
('b2c3d4e5-f6a7-8901-2345-67890abcdef1', 'pm@example.com', '$2a$10$dRMp.qV.e8r.tY.uI.oP.e.aBcDeFgHiJkLmNoPqRsTuVwXyZ', 'Project Manager', 2),
('c3d4e5f6-a7b8-9012-3456-7890abcdef12', 'lead@example.com', '$2a$10$dRMp.qV.e8r.tY.uI.oP.e.aBcDeFgHiJkLmNoPqRsTuVwXyZ', 'Team Lead', 3),
('d4e5f6a7-b8c9-0123-4567-890abcdef123', 'member@example.com', '$2a$10$dRMp.qV.e8r.tY.uI.oP.e.aBcDeFgHiJkLmNoPqRsTuVwXyZ', 'Regular Member', 4),
('e5f6a7b8-c9d0-1234-5678-90abcdef1234', 'client@example.com', '$2a$10$dRMp.qV.e8r.tY.uI.oP.e.aBcDeFgHiJkLmNoPqRsTuVwXyZ', 'Client User', 5);

-- =================================================================
-- End of Seed Data
-- =================================================================


-- =================================================================
-- Team-Tool Template Seed Data
-- =================================================================
-- This section contains sample data for templates, template projects, and template tasks.
-- It will also DELETE existing data in these tables before insertion.
-- =================================================================

-- Clean up in order of dependency to respect foreign key constraints.
DELETE FROM `template_tasks`;
DELETE FROM `template_projects`;
DELETE FROM `templates`;

-- =================================================================
-- Insert Sample Template
-- =================================================================
-- A comprehensive SEO Content Campaign Template.
-- Created by the Project Manager (user_id = 2).
INSERT INTO `templates` (
    `id`, `name`, `description`, `created_by`, `product_info`, `platform_accounts`,
    `image_folder_link`, `brand_guideline_link`, `customer_notes`, `kpis`,
    `personnel_count`, `personnel_levels`, `content_strategy`, `website_page_count`,
    `keywords_plan`, `cluster_model`, `internal_link_plan`
) VALUES (
    1,
    'Standard SEO Content Campaign',
    'A 3-month standard template for launching a new SEO-focused content campaign.',
    2, -- Assuming user with ID 2 is the Project Manager
    'Monthly blog posts, articles, and social media content.',
    'Client blog (WordPress), Twitter, LinkedIn, Facebook.',
    'https://example.com/drive/images',
    'https://example.com/drive/brand-guidelines',
    'Client prefers a friendly, approachable tone. Avoid technical jargon.',
    'Increase organic traffic by 15% QoQ, achieve top 5 ranking for 10 primary keywords.',
    3,
    '1 Senior Content Writer, 1 Junior SEO Specialist, 1 Social Media Manager',
    'Focus on long-form, evergreen content targeting informational keywords. Create topic clusters around main service pages.',
    20,
    '{"primary_keywords": ["keyword 1", "keyword 2"], "secondary_keywords": ["keyword 3", "keyword 4"]}',
    'Pillar-Cluster model. Main service pages are pillars, blog posts are clusters.',
    'All cluster posts must link back to the main pillar page. Include 2-3 internal links to other relevant posts.'
);

-- =================================================================
-- Insert Template Projects (Phases)
-- =================================================================
INSERT INTO `template_projects` (
    `id`, `template_id`, `project_name_template`, `project_description_template`,
    `start_day`, `duration_days`
) VALUES
(
    1, 1, -- Belongs to template 1
    'Phase 1: Research & Foundation',
    'Initial research, planning, and setup phase.',
    1,  -- Starts on day 1 of the project
    30  -- Lasts for 30 days
),
(
    2, 1, -- Belongs to template 1
    'Phase 2: Content Creation & Promotion',
    'Execution phase focusing on creating and distributing content.',
    31, -- Starts on day 31
    60  -- Lasts for 60 days
);

-- =================================================================
-- Insert Template Tasks
-- =================================================================
-- Tasks for "Phase 1: Research & Foundation" (template_project_id = 1)
INSERT INTO `template_tasks` (
    `template_project_id`, `task_name_template`, `task_description_template`,
    `start_day`, `duration_days`
) VALUES
(
    1, 'Keyword Research & Analysis', 'Identify primary and secondary keywords using Ahrefs and SEMrush.',
    1, 10 -- Starts on day 1 of this project phase, lasts 10 days
),
(
    1, 'Content Calendar Planning', 'Develop a 3-month content calendar with topics, formats, and publishing dates.',
    11, 7 -- Starts on day 11 of this project phase, lasts 7 days
),
(
    1, 'Pillar Page Outline Creation', 'Create detailed outlines for the main pillar content pages.',
    18, 12 -- Starts on day 18 of this project phase, lasts 12 days
);

-- Tasks for "Phase 2: Content Creation & Promotion" (template_project_id = 2)
INSERT INTO `template_tasks` (
    `template_project_id`, `task_name_template`, `task_description_template`,
    `start_day`, `duration_days`
) VALUES
(
    2, 'Write & Publish 4 Blog Posts', 'Write, edit, and publish four 1500-word blog posts based on the content calendar.',
    1, 30 -- Starts on day 1 of this project phase, lasts 30 days
),
(
    2, 'Social Media Promotion', 'Create and schedule social media posts for all published content on all platforms.',
    1, 30 -- Runs concurrently for the first 30 days of this phase
),
(
    2, 'Monthly Performance Report', 'Compile and send a report on traffic, rankings, and other KPIs.',
    30, 1 -- Occurs on day 30 of this phase
);
