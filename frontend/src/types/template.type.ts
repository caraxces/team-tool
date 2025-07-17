export interface ProjectKeyword {
    page: string;
    mainKeyword: {
        keyword: string;
        volume: number;
    };
    subKeywords: {
        keyword: string;
        volume: number;
    }[];
}

export interface TemplateProjectDetailsDefinition {
    product_info?: string;
    platform_accounts?: string;
    image_folder_link?: string;
    brand_guideline_link?: string;
    customer_notes?: string;
    kpis?: string;
    personnel_count?: number;
    personnel_levels?: string;
    content_strategy?: string;
    website_page_count?: number;
    cluster_model?: string;
    internal_link_plan?: string;
    keywords_plan?: Partial<ProjectKeyword>[];
}

export interface TemplateTaskDefinition {
    id: number;
    title: string; // Renamed from task_name_template
    description?: string; // Renamed from task_description_template
    priority: 'low' | 'medium' | 'high' | 'urgent';
    start_day: number; // Relative to project start
    duration_days: number;
}

export interface TemplateProjectDefinition {
    id: number;
    name: string; // Renamed from project_name_template
    description: string | undefined; // Renamed from project_description_template
    start_day: number; // Relative to template process start
    duration_days: number;
    tasks: TemplateTaskDefinition[];
    details?: TemplateProjectDetailsDefinition; // Add details field
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

// We need a summary type for the list view, as the full template is heavy
export type TemplateSummary = Pick<Template, 'id' | 'name' | 'description'>;

// More explicit DTOs
export interface CreateTemplateDto {
    name: string;
    description?: string;
    projects: {
        name: string;
        description?: string;
        start_day: number;
        duration_days: number;
        details?: TemplateProjectDetailsDefinition; // Add details field
        tasks: {
            title: string;
            description?: string;
            priority: 'low' | 'medium' | 'high' | 'urgent';
            start_day: number;
            duration_days: number;
        }[];
    }[];
}
export type UpdateTemplateDto = Partial<CreateTemplateDto>; 