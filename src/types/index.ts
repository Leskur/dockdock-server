export type JobStatus = 'pending' | 'pulling' | 'saving' | 'ready' | 'failed';

export interface Job {
  id: string;
  image: string;
  tag: string;
  status: JobStatus;
  progress: number;
  filePath?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}
