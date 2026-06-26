import { buildServer } from './server';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3456;

async function main() {
  const server = await buildServer();
  await server.listen({ port: PORT });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
