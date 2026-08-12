import type { Database } from "../client.js";

export type DatabaseExecutor = Pick<Database, "insert">;
