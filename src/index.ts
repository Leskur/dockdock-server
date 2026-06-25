import { buildServer } from './server';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3456;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const server = await buildServer();
  await server.listen({ port: PORT, host: HOST });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
