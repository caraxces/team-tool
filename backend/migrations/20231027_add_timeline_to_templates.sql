-- Migration to add timeline fields to template tables

ALTER TABLE `template_projects`
ADD COLUMN `start_day` INT NOT NULL DEFAULT 0 COMMENT 'Relative start day from the beginning of the template process',
ADD COLUMN `duration_days` INT NOT NULL DEFAULT 1 COMMENT 'Duration of the project in days';

ALTER TABLE `template_tasks`
ADD COLUMN `start_day` INT NOT NULL DEFAULT 0 COMMENT 'Relative start day from the beginning of the parent project',
ADD COLUMN `duration_days` INT NOT NULL DEFAULT 1 COMMENT 'Duration of the task in days'; 