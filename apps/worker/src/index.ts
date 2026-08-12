import { pathToFileURL } from "node:url";

import { bootstrapWorker } from "./worker.js";

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  bootstrapWorker({ dataProfile: process.env.DATA_PROFILE })
    .then((result) => {
      console.info(JSON.stringify(result));
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}

export { bootstrapWorker } from "./worker.js";
export { ingestProvider } from "./ingestion.js";
