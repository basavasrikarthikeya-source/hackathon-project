import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Project,
  Chat,
  ChatMessage,
  ProjectAsset,
  Job,
  ActivityItem,
  FindingSummary,
  ProjectFocus
} from '../types';
import { SAMPLE_IMAGES, DEMO_ANSWERS } from '../constants/sampleData';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// LocalStorage persistent keys for offline & clean session mode
const STORAGE_KEYS = {
  PROJECTS: 'drishti_projects_v5_clean',
  CHATS: 'drishti_chats_v5_clean',
  MESSAGES: 'drishti_messages_v5_clean',
  ASSETS: 'drishti_assets_v5_clean',
  JOBS: 'drishti_jobs_v5_clean',
  ACTIVITIES: 'drishti_activities_v5_clean',
  LAST_CHAT_ID: 'drishti_last_chat_id',
  SIDEBAR_COLLAPSED: 'drishti_sidebar_collapsed',
};

// Clean initial data - zero demo/dummy clutter
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'default-workspace',
    owner_id: 'usr-default',
    name: 'Workspace',
    area_label: 'Earth Observation',
    focus: ['Buildings', 'Water', 'Trees', 'Change detection'],
    description: 'Clean workspace for satellite intelligence and environmental analysis.',
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    chat_count: 0,
    image_count: 0
  }
];

const INITIAL_CHATS: Chat[] = [];
const INITIAL_ASSETS: ProjectAsset[] = [];
const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {};

// Helper to get from storage or init
function getLocal<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn('LocalStorage write failed:', err);
  }
}

// Active job subscriptions for simulated Realtime
type JobSubscriber = (job: Job) => void;
const jobSubscribers: Map<string, Set<JobSubscriber>> = new Map();

/**
 * Project and Chat Database Service Layer
 * Supports Supabase when configured, with 100% full-featured offline / mock engine fallback.
 */
export const dataService = {
  // --------------------------------------------------------------------------
  // PROJECTS
  // --------------------------------------------------------------------------
  async getProjects(search: string = '', sort: 'recent' | 'name' = 'recent'): Promise<Project[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('projects')
          .select('*')
          .eq('archived', false);

        if (search.trim()) {
          query = query.ilike('name', `%${search.trim()}%`);
        }
        if (sort === 'name') {
          query = query.order('name', { ascending: true });
        } else {
          query = query.order('updated_at', { ascending: false });
        }

        const { data, error } = await query;
        if (!error && data) return data as Project[];
      } catch (err) {
        console.warn('Supabase getProjects error, falling back to local:', err);
      }
    }

    // Local fallback
    let list = getLocal<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    list = list.filter(p => !p.archived);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.area_label.toLowerCase().includes(q));
    }

    if (sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }

    return list;
  },

  async getProject(id: string): Promise<Project | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data as Project;
      } catch (err) {
        console.warn('Supabase getProject error:', err);
      }
    }

    const list = getLocal<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    return list.find(p => p.id === id) || null;
  },

  async createProject(params: {
    name: string;
    area_label: string;
    focus: ProjectFocus[];
    description?: string;
    aoi_geojson?: any;
  }): Promise<Project> {
    const newProj: Project = {
      id: `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      owner_id: 'usr-default',
      name: params.name,
      area_label: params.area_label || 'Global Region',
      focus: params.focus,
      description: params.description || '',
      aoi_geojson: params.aoi_geojson,
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      chat_count: 0,
      image_count: 0,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert(newProj)
          .select()
          .single();
        if (!error && data) return data as Project;
      } catch (err) {
        console.warn('Supabase createProject error:', err);
      }
    }

    const list = getLocal<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    list.unshift(newProj);
    setLocal(STORAGE_KEYS.PROJECTS, list);
    return newProj;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const updatedTimestamp = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .update({ ...updates, updated_at: updatedTimestamp })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as Project;
      } catch (err) {
        console.warn('Supabase updateProject error:', err);
      }
    }

    const list = getLocal<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const idx = list.findIndex(p => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updated_at: updatedTimestamp };
      setLocal(STORAGE_KEYS.PROJECTS, list);
      return list[idx];
    }
    throw new Error(`Project ${id} not found`);
  },

  async deleteProject(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('projects')
          .update({ archived: true })
          .eq('id', id);
        return;
      } catch (err) {
        console.warn('Supabase deleteProject error:', err);
      }
    }

    const list = getLocal<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const updated = list.map(p => p.id === id ? { ...p, archived: true } : p);
    setLocal(STORAGE_KEYS.PROJECTS, updated);
  },

  // --------------------------------------------------------------------------
  // CHATS
  // --------------------------------------------------------------------------
  async getChats(projectId?: string, options?: { filter?: 'all' | 'interactive' | 'comparison' | 'pinned'; search?: string; limit?: number }): Promise<Chat[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('chats')
          .select('*')
          .eq('archived', false);

        if (projectId) {
          query = query.eq('project_id', projectId);
        }
        if (options?.filter === 'pinned') {
          query = query.eq('pinned', true);
        } else if (options?.filter === 'interactive' || options?.filter === 'comparison') {
          query = query.eq('mode', options.filter);
        }
        if (options?.search) {
          query = query.ilike('title', `%${options.search.trim()}%`);
        }

        query = query.order('pinned', { ascending: false }).order('last_message_at', { ascending: false });

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (!error && data) return data as Chat[];
      } catch (err) {
        console.warn('Supabase getChats error:', err);
      }
    }

    let list = getLocal<Chat[]>(STORAGE_KEYS.CHATS, INITIAL_CHATS);
    list = list.filter(c => !c.archived);

    if (projectId) {
      list = list.filter(c => c.project_id === projectId);
    }
    if (options?.filter === 'pinned') {
      list = list.filter(c => c.pinned);
    } else if (options?.filter === 'interactive' || options?.filter === 'comparison') {
      list = list.filter(c => c.mode === options.filter);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || (c.last_question && c.last_question.toLowerCase().includes(q)));
    }

    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    if (options?.limit) {
      list = list.slice(0, options.limit);
    }

    return list;
  },

  async getChat(id: string): Promise<Chat | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data as Chat;
      } catch (err) {
        console.warn('Supabase getChat error:', err);
      }
    }

    const list = getLocal<Chat[]>(STORAGE_KEYS.CHATS, INITIAL_CHATS);
    return list.find(c => c.id === id) || null;
  },

  async createChat(
    projectId: string,
    titleOrOpts?: string | { title?: string; mode?: 'interactive' | 'comparison' },
    maybeMode?: 'interactive' | 'comparison'
  ): Promise<Chat> {
    const title = typeof titleOrOpts === 'string'
      ? titleOrOpts
      : titleOrOpts?.title || 'New Inspection';
    const mode = typeof titleOrOpts === 'object' && titleOrOpts?.mode
      ? titleOrOpts.mode
      : maybeMode || 'interactive';

    const newChat: Chat = {
      id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      project_id: projectId,
      owner_id: 'usr-default',
      title,
      mode,
      pinned: false,
      archived: false,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image_count: 0,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('chats')
          .insert(newChat)
          .select()
          .single();
        if (!error && data) return data as Chat;
      } catch (err) {
        console.warn('Supabase createChat error:', err);
      }
    }

    const list = getLocal<Chat[]>(STORAGE_KEYS.CHATS, INITIAL_CHATS);
    list.unshift(newChat);
    setLocal(STORAGE_KEYS.CHATS, list);

    // Update project chat_count
    this.incrementProjectChatCount(projectId);

    return newChat;
  },

  async duplicateChat(chatId: string): Promise<Chat> {
    const original = await this.getChat(chatId);
    if (!original) throw new Error(`Chat ${chatId} not found`);

    const duplicated = await this.createChat(
      original.project_id,
      `${original.title} (Copy)`,
      original.mode
    );

    // Copy messages if present
    const originalMsgs = await this.getMessages(chatId);
    if (originalMsgs.length > 0) {
      const allMsgs = getLocal<Record<string, ChatMessage[]>>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
      allMsgs[duplicated.id] = originalMsgs.map(m => ({
        ...m,
        id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        chat_id: duplicated.id
      }));
      setLocal(STORAGE_KEYS.MESSAGES, allMsgs);
    }

    return duplicated;
  },

  async updateChat(id: string, updates: Partial<Chat>): Promise<Chat> {
    const updatedTimestamp = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('chats')
          .update({ ...updates, updated_at: updatedTimestamp })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as Chat;
      } catch (err) {
        console.warn('Supabase updateChat error:', err);
      }
    }

    const list = getLocal<Chat[]>(STORAGE_KEYS.CHATS, INITIAL_CHATS);
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updated_at: updatedTimestamp };
      setLocal(STORAGE_KEYS.CHATS, list);
      return list[idx];
    }
    throw new Error(`Chat ${id} not found`);
  },

  async deleteChat(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('chats')
          .update({ archived: true })
          .eq('id', id);
        return;
      } catch (err) {
        console.warn('Supabase deleteChat error:', err);
      }
    }

    const list = getLocal<Chat[]>(STORAGE_KEYS.CHATS, INITIAL_CHATS);
    const updated = list.map(c => c.id === id ? { ...c, archived: true } : c);
    setLocal(STORAGE_KEYS.CHATS, updated);
  },

  async restoreChat(id: string): Promise<Chat | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('chats')
          .update({ archived: false })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as Chat;
      } catch (err) {
        console.warn('Supabase restoreChat error:', err);
      }
    }

    const list = getLocal<Chat[]>(STORAGE_KEYS.CHATS, INITIAL_CHATS);
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], archived: false };
      setLocal(STORAGE_KEYS.CHATS, list);
      return list[idx];
    }
    return null;
  },

  // --------------------------------------------------------------------------
  // MESSAGES
  // --------------------------------------------------------------------------
  async getMessages(chatId: string): Promise<ChatMessage[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            results(*),
            message_assets(asset_id, slot, assets(*))
          `)
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data.map(m => ({
            id: m.id,
            chat_id: m.chat_id,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
            result: m.results?.[0]?.answer_json || undefined,
            assets: m.message_assets?.map((ma: any) => ({
              id: ma.assets?.id || ma.asset_id,
              name: ma.assets?.filename || 'image.jpg',
              url: ma.assets?.storage_path || '',
              format: ma.assets?.kind || 'JPG',
              type: ma.slot,
              size: ma.assets?.size_bytes ? `${Math.round(ma.assets.size_bytes / 1024 / 1024 * 10) / 10} MB` : undefined
            }))
          }));
        }
      } catch (err) {
        console.warn('Supabase getMessages error:', err);
      }
    }

    const all = getLocal<Record<string, ChatMessage[]>>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    return all[chatId] || [];
  },

  async createMessage(
    chatId: string,
    roleOrObj: 'user' | 'assistant' | 'system' | { role: 'user' | 'assistant' | 'system'; text?: string; content?: string; images?: any[]; assets?: any[]; result?: any },
    maybeContent?: string,
    maybeAssets?: any[],
    maybeResult?: any
  ): Promise<ChatMessage> {
    let role: 'user' | 'assistant' | 'system' = 'user';
    let content = '';
    let assets = maybeAssets;
    let result = maybeResult;

    if (typeof roleOrObj === 'object') {
      role = roleOrObj.role;
      content = roleOrObj.content || roleOrObj.text || '';
      assets = roleOrObj.assets || roleOrObj.images;
      result = roleOrObj.result;
    } else {
      role = roleOrObj;
      content = maybeContent || '';
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      chat_id: chatId,
      role,
      content,
      created_at: new Date().toISOString(),
      assets,
      result,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            id: newMsg.id,
            chat_id: chatId,
            role,
            content
          })
          .select()
          .single();

        if (!error && data && result) {
          await supabase.from('results').insert({
            message_id: newMsg.id,
            verdict: result.verdict,
            answer_json: result,
            latency_ms: result.confidenceScore ? Math.round(result.confidenceScore * 10) : 120
          });
        }
      } catch (err) {
        console.warn('Supabase createMessage error:', err);
      }
    }

    const all = getLocal<Record<string, ChatMessage[]>>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    const thread = all[chatId] || [];
    thread.push(newMsg);
    all[chatId] = thread;
    setLocal(STORAGE_KEYS.MESSAGES, all);

    // Update chat last_message_at and question preview
    const chatUpdates: Partial<Chat> = {
      last_message_at: newMsg.created_at,
    };
    if (role === 'user') {
      chatUpdates.last_question = content;
    } else if (result?.verdict) {
      chatUpdates.last_verdict = result.verdict;
    }
    this.updateChat(chatId, chatUpdates).catch(() => {});

    return newMsg;
  },

  // --------------------------------------------------------------------------
  // ASSETS & PROJECT LIBRARY
  // --------------------------------------------------------------------------
  async getAssets(projectId: string): Promise<ProjectAsset[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        if (!error && data) return data as ProjectAsset[];
      } catch (err) {
        console.warn('Supabase getAssets error:', err);
      }
    }

    const all = getLocal<ProjectAsset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
    return all.filter(a => a.project_id === projectId);
  },

  async createAsset(projectId: string, asset: Partial<ProjectAsset>): Promise<ProjectAsset> {
    const newAsset: ProjectAsset = {
      id: `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      project_id: projectId,
      owner_id: 'usr-default',
      storage_path: asset.storage_path || `projects/${projectId}/${asset.filename || 'imagery.jpg'}`,
      filename: asset.filename || 'satellite-raster.jpg',
      kind: asset.kind || 'JPG',
      size_bytes: asset.size_bytes || 5000000,
      width: asset.width || 1920,
      height: asset.height || 1080,
      source: asset.source || 'Optical Sensor',
      created_at: new Date().toISOString(),
      used_in_chats_count: 1,
      url: asset.url || '/assets/earth-horizon.png'
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('assets')
          .insert(newAsset)
          .select()
          .single();
        if (!error && data) return data as ProjectAsset;
      } catch (err) {
        console.warn('Supabase createAsset error:', err);
      }
    }

    const all = getLocal<ProjectAsset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
    all.unshift(newAsset);
    setLocal(STORAGE_KEYS.ASSETS, all);
    return newAsset;
  },

  // --------------------------------------------------------------------------
  // JOBS & REALTIME PROGRESS
  // --------------------------------------------------------------------------
  async createJob(chatId: string, initialStage: string = 'Initialising sensor alignment...'): Promise<Job> {
    const newJob: Job = {
      id: `job-${Date.now().toString(36)}`,
      chat_id: chatId,
      status: 'running',
      stage: initialStage,
      started_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('jobs').insert(newJob).select().single();
        if (data) return data as Job;
      } catch (err) {
        console.warn('Supabase createJob error:', err);
      }
    }

    const jobs = getLocal<Job[]>(STORAGE_KEYS.JOBS, []);
    jobs.unshift(newJob);
    setLocal(STORAGE_KEYS.JOBS, jobs);

    // Notify local subscribers
    this.notifyJobSubscribers(chatId, newJob);

    return newJob;
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('jobs').update(updates).eq('id', id).select().single();
        if (data) return data as Job;
      } catch (err) {
        console.warn('Supabase updateJob error:', err);
      }
    }

    const jobs = getLocal<Job[]>(STORAGE_KEYS.JOBS, []);
    const idx = jobs.findIndex(j => j.id === id);
    if (idx !== -1) {
      jobs[idx] = { ...jobs[idx], ...updates };
      setLocal(STORAGE_KEYS.JOBS, jobs);
      this.notifyJobSubscribers(jobs[idx].chat_id, jobs[idx]);
      return jobs[idx];
    }
    throw new Error(`Job ${id} not found`);
  },

  subscribeToJobs(chatId: string, callback: JobSubscriber): () => void {
    if (!jobSubscribers.has(chatId)) {
      jobSubscribers.set(chatId, new Set());
    }
    jobSubscribers.get(chatId)!.add(callback);

    let supabaseChannel: any = null;
    if (isSupabaseConfigured && supabase) {
      supabaseChannel = supabase
        .channel(`jobs:${chatId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'jobs', filter: `chat_id=eq.${chatId}` },
          (payload: any) => {
            if (payload.new) callback(payload.new as Job);
          }
        )
        .subscribe();
    }

    return () => {
      jobSubscribers.get(chatId)?.delete(callback);
      if (supabaseChannel && supabase) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  },

  notifyJobSubscribers(chatId: string, job: Job) {
    const set = jobSubscribers.get(chatId);
    if (set) {
      set.forEach(cb => {
        try { cb(job); } catch {}
      });
    }
  },

  // --------------------------------------------------------------------------
  // FINDINGS SUMMARY (Real data only, never invented)
  // --------------------------------------------------------------------------
  async getProjectFindings(projectId: string): Promise<FindingSummary[]> {
    const chats = await this.getChats(projectId);
    const findings: FindingSummary[] = [];

    for (const chat of chats) {
      const messages = await this.getMessages(chat.id);
      for (const msg of messages) {
        if (msg.result && msg.result.metricValue) {
          const val = String(msg.result.metricValue);
          const unit = msg.result.metricUnit || '';
          let cat: 'trees' | 'structures' | 'water' | 'forest_loss' = 'structures';
          if (unit.toLowerCase().includes('ha') || msg.result.headline.toLowerCase().includes('flood')) {
            cat = 'water';
          } else if (msg.result.headline.toLowerCase().includes('tree') || msg.result.headline.toLowerCase().includes('canopy')) {
            cat = 'trees';
          }

          findings.push({
            id: `finding-${msg.id}`,
            label: msg.result.headline,
            value: val,
            unit,
            category: cat,
            source_chat_id: chat.id,
            source_chat_title: chat.title,
            verdict: msg.result.verdict
          });

          if (findings.length >= 4) break;
        }
      }
      if (findings.length >= 4) break;
    }

    return findings;
  },

  // --------------------------------------------------------------------------
  // ACTIVITY TIMELINE
  // --------------------------------------------------------------------------
  async getProjectActivity(projectId: string): Promise<ActivityItem[]> {
    const chats = await this.getChats(projectId);
    const activities: ActivityItem[] = [];

    chats.forEach(chat => {
      activities.push({
        id: `act-${chat.id}-upd`,
        project_id: projectId,
        chat_id: chat.id,
        chat_title: chat.title,
        action: 'Inspection updated',
        detail: chat.last_question || 'Query executed',
        timestamp: chat.last_message_at
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return activities.slice(0, 10);
  },

  // --------------------------------------------------------------------------
  // HELPERS & EXPORTS
  // --------------------------------------------------------------------------
  getLastChatId(): string | null {
    return getLocal<string | null>(STORAGE_KEYS.LAST_CHAT_ID, null);
  },

  setLastChatId(id: string): void {
    setLocal(STORAGE_KEYS.LAST_CHAT_ID, id);
  },

  getSidebarCollapsed(): boolean {
    return getLocal<boolean>(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
  },

  setSidebarCollapsed(collapsed: boolean): void {
    setLocal(STORAGE_KEYS.SIDEBAR_COLLAPSED, collapsed);
  },

  incrementProjectChatCount(projectId: string) {
    const list = getLocal<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const idx = list.findIndex(p => p.id === projectId);
    if (idx !== -1) {
      list[idx].chat_count = (list[idx].chat_count || 0) + 1;
      list[idx].updated_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.PROJECTS, list);
    }
  },

  /**
   * Export chat to PDF / print document
   */
  async exportChatToPdf(chatId: string): Promise<void> {
    if (typeof window !== 'undefined') {
      window.print();
    }
  },

  /**
   * Export project to ZIP of JSON metadata + imagery links
   * Marked TODO for backend zip bundling if offline
   */
  async exportProjectToZip(projectId: string): Promise<void> {
    const project = await this.getProject(projectId);
    const chats = await this.getChats(projectId);
    const assets = await this.getAssets(projectId);

    const exportData = {
      project,
      chats,
      assets,
      exported_at: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name.toLowerCase().replace(/\s+/g, '_') || 'project'}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
