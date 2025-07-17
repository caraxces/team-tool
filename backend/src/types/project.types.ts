// For the keywords_plan JSON field
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

export interface ProjectDetails {
    id: number;
    project_id: number;
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
    created_at: string;
    updated_at: string;
} 