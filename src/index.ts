import { buildServer } from './server';

const app = buildServer({ logger: true });
const port = Number(process.env.PORT ?? 3000);

app
  .listen({ port, host: '0.0.0.0' })
  .then((address) => app.log.info(`ai-due-diligence-assistant listening on ${address}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
