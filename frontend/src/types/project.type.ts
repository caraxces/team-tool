import { User } from "./user.type";

// This type represents the data structure returned by the main projects API
export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'Completed' | 'On Track' | 'At Risk' | 'Planning';
  progress: number;
  deadline: string;
  pic: {
      id: number;
      name: string;
      avatar: string | null;
  } | null;
  members: {
      id: number;
      name: string;
      avatar: string | null;
  }[];
}

// These types are for the new Project Details feature
export interface ProjectKeyword {
    id?: number;
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