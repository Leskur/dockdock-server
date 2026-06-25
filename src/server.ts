import Fastify from 'fastify';
import imageRoutes from './routes/images';

export async function buildServer() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(imageRoutes, { prefix: '/api/v1/images' });

  return fastify;
}
