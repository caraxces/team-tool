import { ProjectKeyword } from "./project.types";
import { ProjectDetails } from './project.types';

// Based on ProjectDetails, but for use in templates
// All fields are optional and can contain placeholders
export interface TemplateProjectDetailsDefinition extends Partial<Omit<ProjectDetails, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'keywords_plan'>> {
    keywords_plan?: Partial<ProjectKeyword>[];
}

export interface TemplateTaskDefinition {
    id?: number;
    task_name_template: string;
    task_description_template?: string;
    start_day: number; // Relative to project start
    duration_days: number;
}

export interface TemplateProjectDefinition {
    id?: number;
    project_name_template: string;
    project_description_template?: string;
    start_day: number; // Relative to template process start
    duration_days: number;
    tasks: TemplateTaskDefinition[];
}

export interface Template {
    id: number;
    name: string;
    description: string | null;
    created_by: number;
    
    /*
    // Fields from old project_details - commenting out as they seem deprecated
    product_info: string | null;
    platform_accounts: string | null;
    image_folder_link: string | null;
    brand_guideline_link: string | null;
    customer_notes: string | null;
    kpis: string | null;
    personnel_count: number | null;
    personnel_levels: string | null;
    content_strategy: string | null;
    website_page_count: number | null;
    keywords_plan: ProjectKeyword[] | null;
    cluster_model: string | null;
    internal_link_plan: string | null;
    */

    // Relational data
    projects: TemplateProjectDefinition[];

    // Timestamps
    created_at: string;
    updated_at: string;
}

// More explicit DTOs
export interface CreateTemplateDto {
    name: string;
    description?: string;
    projects: {
        name: string;
        description?: string;
        start_day: number;
        duration_days: number;
        tasks: {
            title: string;
            description?: string;
            start_day: number;
            duration_days: number;
        }[];
    }[];
}
export type UpdateTemplateDto = Partial<CreateTemplateDto>; 