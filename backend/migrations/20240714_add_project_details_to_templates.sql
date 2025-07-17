-- Migration to add project details to templates
-- 2024-07-14

-- This table will store the detailed information for a project within a template,
-- mirroring the structure of `project_details` but linked to `template_projects`.
-- Admin can pre-fill this information, using placeholders like {client_name},
-- which will then be used to generate the actual project details.

CREATE TABLE `template_project_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `template_project_id` INT NOT NULL,
  `product_info` TEXT,
  `platform_accounts` TEXT,
  `image_folder_link` VARCHAR(2048),
  `brand_guideline_link` VARCHAR(2048),
  `customer_notes` TEXT,
  `kpis` TEXT,
  `personnel_count` INT,
  `personnel_levels` TEXT,
  `content_strategy` TEXT,
  `website_page_count` INT,
  `keywords_plan` JSON,
  `cluster_model` TEXT,
  `internal_link_plan` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_template_project_details_template_project`
    FOREIGN KEY (`template_project_id`)
    REFERENCES `template_projects`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add a UNIQUE constraint to ensure one detail set per template project
ALTER TABLE `template_project_details` ADD UNIQUE INDEX `idx_unique_template_project_id` (`template_project_id`); 