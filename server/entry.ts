import { tsRestHandler } from "./ts-rest-handler";
import { apply, serve } from "@photonjs/h3";
import { createApp } from "h3";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export default startServer();

function startServer() {
  const app = createApp();

  apply(app, [
    // ts-rest route. See https://ts-rest.com
    tsRestHandler,
  ]);

  return serve(app, {
    port,
  });
}
