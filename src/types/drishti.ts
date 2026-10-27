export interface Project {
  id: string;
  name: string;
  location: string;
  description: string;
  bannerImage: string;
  tags: string[];
  extraTagCount?: number;
  chatCount: number;
  imageCount: number;
  lastActive: string;
}

export interface Inspection {
  id: string;
  projectId: string;
  title: string;
  timeAgo: string;
  group: "PINNED" | "TODAY" | "YESTERDAY";
  prompt: string;
  mode: "interactive" | "comparison";
  imagePaths: string[];
  status: "processing" | "done" | "error" | "draft";
  answer?: string;
  markedImagePath?: string;
  createdAt: string;
}
