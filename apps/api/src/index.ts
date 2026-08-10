import { pathToFileURL } from "node:url";

import { buildApi } from "./app.js";

function parsePort(value: string | undefined) {
  const port = Number(value ?? "4100");

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("API_PORT must be an integer between 1 and 65535");
  }

  return port;
}

export async function startApi() {
  const app = buildApi({
    dataProfile: process.env.DATA_PROFILE,
    logger: true,
  });

  await app.listen({
    host: process.env.API_HOST ?? "127.0.0.1",
    port: parsePort(process.env.API_PORT),
  });

  return app;
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  startApi().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
