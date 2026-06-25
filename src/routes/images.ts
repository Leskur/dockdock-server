import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { Job } from '../types';
import {
  processJob,
  loadCache,
  cacheKey,
  getStoragePath,
  CACHE_TTL_MS,
  CacheEntry,
} from '../services/docker';

interface DownloadBody {
  image: string;
  tag?: string;
}

export default async function imageRoutes(fastify: FastifyInstance) {
  const jobs = new Map<string, Job>();
  const imageCache = new Map<string, CacheEntry>();

  const savedCache = await loadCache();
  const now = Date.now();
  for (const [key, entry] of savedCache.entries()) {
    if (entry.updatedAt + CACHE_TTL_MS > now) {
      imageCache.set(key, entry);
      jobs.set(entry.jobId, {
        id: entry.jobId,
        image: entry.image,
        tag: entry.tag,
        status: 'ready',
        progress: 100,
        filePath: entry.filePath,
        createdAt: entry.updatedAt,
        updatedAt: entry.updatedAt,
      });
    }
  }

  fastify.post<{ Body: DownloadBody }>('/download', async (request, reply) => {
    const { image, tag = 'latest' } = request.body;
    if (!image || typeof image !== 'string') {
      return reply.status(400).send({ error: 'image is required' });
    }

    const key = cacheKey(image, tag);
    const cached = imageCache.get(key);
    if (cached) {
      const cachedJob = jobs.get(cached.jobId);
      if (cachedJob && cachedJob.status !== 'failed') {
        if (cachedJob.updatedAt + CACHE_TTL_MS > Date.now()) {
          return reply.status(202).send({ id: cachedJob.id, status: cachedJob.status });
        }
      }
    }

    const id = randomUUID();
    const filePath = getStoragePath(image, tag);
    const job: Job = {
      id,
      image,
      tag,
      status: 'pending',
      progress: 0,
      filePath,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    jobs.set(id, job);
    imageCache.set(key, {
      jobId: id,
      image,
      tag,
      filePath,
      updatedAt: Date.now(),
    });
    processJob(job, jobs, imageCache);

    return reply.status(202).send({ id, status: job.status });
  });

  fastify.get('/download/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = jobs.get(id);
    if (!job) {
      return reply.status(404).send({ error: 'job not found' });
    }
    return {
      id: job.id,
      image: job.image,
      tag: job.tag,
      status: job.status,
      progress: job.progress,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  });

  fastify.get('/download/:id/file', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = jobs.get(id);
    if (!job) {
      return reply.status(404).send({ error: 'job not found' });
    }
    if (job.status !== 'ready' || !job.filePath) {
      return reply.status(400).send({ error: 'image not ready' });
    }

    const stream = fs.createReadStream(job.filePath);
    reply.header('Content-Type', 'application/gzip');
    reply.header(
      'Content-Disposition',
      `attachment; filename="${job.image}_${job.tag}.tar.gz"`
    );
    return reply.send(stream);
  });
}
