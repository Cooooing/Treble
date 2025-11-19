import ThemeHandlers from "./handlers/theme";
import { apply, serve } from "@photonjs/fastify";
import fastify, { type FastifyInstance } from "fastify";
import rawBody from "fastify-raw-body";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 2324;

export default await startServer();

async function startServer(): Promise<FastifyInstance> {
  const app = fastify({
    // Ensures proper HMR support
    forceCloseConnections: true,
  });

  // /!\ Mandatory if you need to access the request body in any Universal Middleware or Handler
  await app.register(rawBody);

  await apply(app, ThemeHandlers);

  return serve(app, {
    port,
  });
}
