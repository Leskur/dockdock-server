import Fastify from 'fastify';
import imageRoutes from './routes/images';

export async function buildServer() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(imageRoutes, { prefix: '/images' });

  return fastify;
}
