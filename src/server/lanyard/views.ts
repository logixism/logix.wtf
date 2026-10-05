import { z } from "zod";
import { DISCORD_USER_ID } from "../../shared/profile";
import { getServerEnv } from "../env";

const userUrl = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;
const viewResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    kv: z.object({ siteViews: z.string().regex(/^\d+$/).optional() }),
  }),
});

type SiteViewCounterOptions = {
  apiKey: string;
  fetch?: typeof globalThis.fetch;
};

export type SiteViewCounter = () => Promise<bigint>;

export function createSiteViewCounter({
  apiKey,
  fetch: fetchFn = globalThis.fetch,
}: SiteViewCounterOptions): SiteViewCounter {
  let views: bigint | undefined;
  let pending = Promise.resolve();

  const increment = async (): Promise<bigint> => {
    if (views === undefined) {
      const response = await fetchFn(userUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) {
        throw new Error(`Could not read Lanyard siteViews: ${response.status}`);
      }
      const { data } = viewResponseSchema.parse(await response.json());
      views = BigInt(data.kv.siteViews ?? "0");
    }

    const next = views + 1n;
    const response = await fetchFn(`${userUrl}/kv/siteViews`, {
      method: "PUT",
      headers: {
        Authorization: apiKey,
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: next.toString(),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new Error(`Could not write Lanyard siteViews: ${response.status}`);
    }
    views = next;
    return next;
  };

  return () => {
    // Lanyard has no atomic increment; one server process must own this key.
    const result = pending.then(increment);
    pending = result.then(
      () => undefined,
      () => {
        // A failed response may still have persisted the write. Re-read next time.
        views = undefined;
      },
    );
    return result;
  };
}

let sharedCounter: SiteViewCounter | undefined;

export function recordSiteView(): Promise<bigint> {
  sharedCounter ??= createSiteViewCounter({
    apiKey: getServerEnv().LANYARD_API_KEY,
  });
  return sharedCounter();
}
