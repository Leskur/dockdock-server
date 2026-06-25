import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { Job } from '../types';

const STORAGE_DIR = path.join(process.cwd(), 'storage');

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface CacheEntry {
  jobId: string;
  image: string;
  tag: string;
  filePath: string;
  updatedAt: number;
}

export async function ensureStorageDir(): Promise<void> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

export function cacheKey(image: string, tag: string): string {
  return `${image}:${tag}`;
}

export function getStoragePath(image: string, tag: string): string {
  const safe = `${image}_${tag}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  return path.join(STORAGE_DIR, `${safe}.tar.gz`);
}

export async function loadCache(): Promise<Map<string, CacheEntry>> {
  await ensureStorageDir();
  const cachePath = path.join(STORAGE_DIR, 'cache.json');
  try {
    const raw = await fs.readFile(cachePath, 'utf-8');
    const data = JSON.parse(raw) as Record<string, CacheEntry>;
    const result = new Map<string, CacheEntry>();
    for (const [key, entry] of Object.entries(data)) {
      try {
        await fs.access(entry.filePath);
        result.set(key, entry);
      } catch {
        // file is missing, skip
      }
    }
    return result;
  } catch {
    return new Map();
  }
}

export async function saveCache(cache: Map<string, CacheEntry>): Promise<void> {
  await ensureStorageDir();
  const cachePath = path.join(STORAGE_DIR, 'cache.json');
  const data = Object.fromEntries(cache);
  await fs.writeFile(cachePath, JSON.stringify(data, null, 2));
}

export function processJob(job: Job, jobs: Map<string, Job>, imageCache: Map<string, CacheEntry>): void {
  processImage(job, jobs, imageCache).catch((err) => {
    job.status = 'failed';
    job.error = err instanceof Error ? err.message : String(err);
    job.updatedAt = Date.now();
    jobs.set(job.id, job);

    const key = cacheKey(job.image, job.tag);
    const entry = imageCache.get(key);
    if (entry && entry.jobId === job.id) {
      imageCache.delete(key);
    }
  });
}

async function processImage(job: Job, jobs: Map<string, Job>, imageCache: Map<string, CacheEntry>): Promise<void> {
  await ensureStorageDir();
  const imageTag = `${job.image}:${job.tag}`;
  const filePath = job.filePath || getStoragePath(job.image, job.tag);

  job.status = 'pulling';
  job.updatedAt = Date.now();
  jobs.set(job.id, job);

  await runShellCommand(`docker pull ${imageTag}`);

  job.status = 'saving';
  job.updatedAt = Date.now();
  jobs.set(job.id, job);

  await runShellCommand(`docker save ${imageTag} | gzip > ${filePath}`);

  job.status = 'ready';
  job.filePath = filePath;
  job.progress = 100;
  job.updatedAt = Date.now();
  jobs.set(job.id, job);

  const key = cacheKey(job.image, job.tag);
  imageCache.set(key, {
    jobId: job.id,
    image: job.image,
    tag: job.tag,
    filePath,
    updatedAt: Date.now(),
  });
  await saveCache(imageCache);
}

function runShellCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true });
    let stderr = '';

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}
