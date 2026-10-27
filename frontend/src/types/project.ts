import { AppMode, AttachedImage, DrishtiAnswer, VerdictType } from './index';

export type ProjectFocus = 'Trees' | 'Buildings' | 'Water' | 'Roads' | 'Change detection';

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  area_label: string;
  aoi_geojson?: any;
  focus: ProjectFocus[];
  description?: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  // Computed stats for display
  chat_count?: number;
  image_count?: number;
  latest_image_url?: string;
}

export interface Chat {
  id: string;
  project_id: string;
  owner_id: string;
  title: string;
  mode: AppMode;
  pinned: boolean;
  archived: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  last_question?: string;
  last_verdict?: VerdictType;
  image_count?: number;
  is_running_job?: boolean;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  assets?: AttachedImage[];
  result?: DrishtiAnswer;
}

export interface ProjectAsset {
  id: string;
  project_id: string;
  owner_id: string;
  storage_path: string;
  filename: string;
  kind: string; // 'GeoTIFF' | 'PNG' | 'JPG' | 'API Stream'
  size_bytes: number;
  width?: number;
  height?: number;
  source?: string;
  created_at: string;
  used_in_chats_count: number;
  url: string;
}

export interface Job {
  id: string;
  chat_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'terminated';
  stage: string;
  started_at: string;
  finished_at?: string;
}

export interface ActivityItem {
  id: string;
  project_id: string;
  chat_id?: string;
  chat_title?: string;
  action: string;
  detail: string;
  timestamp: string;
}

export interface FindingSummary {
  id: string;
  label: string;
  value: string;
  unit: string;
  category: 'trees' | 'structures' | 'water' | 'forest_loss';
  source_chat_id: string;
  source_chat_title: string;
  verdict: VerdictType;
}
