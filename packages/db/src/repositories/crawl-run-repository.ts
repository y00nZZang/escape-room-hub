import { crawlRuns } from "../schema.js";
import type { DatabaseExecutor } from "./database-executor.js";

export interface SuccessfulCrawlRun {
  readonly finishedAt: Date;
  readonly recordsSeen: number;
  readonly recordsWritten: number;
  readonly sourceId: string;
  readonly startedAt: Date;
}

export async function insertSuccessfulCrawlRun(
  db: DatabaseExecutor,
  run: SuccessfulCrawlRun,
): Promise<string> {
  const [storedRun] = await db
    .insert(crawlRuns)
    .values({
      ...run,
      outcome: "success",
    })
    .returning({ id: crawlRuns.id });

  if (storedRun === undefined) {
    throw new Error(`Failed to record crawl run for ${run.sourceId}`);
  }

  return storedRun.id;
}
