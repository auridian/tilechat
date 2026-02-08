import { eq, and, ne, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Bounty } from "@/lib/db/schema";

export async function createBounty(
  creatorAlienId: string,
  title: string,
  description: string | null,
  rewardAmount: number | null,
  rewardToken: string | null,
  lat: string | null,
  lon: string | null,
): Promise<Bounty> {
  const [bounty] = await db
    .insert(schema.bounties)
    .values({
      creatorAlienId,
      title,
      description,
      rewardAmount,
      rewardToken: rewardToken ?? "USDC",
      lat,
      lon,
    })
    .returning();
  return bounty;
}

export async function getBountiesByUser(alienId: string): Promise<Bounty[]> {
  return db.query.bounties.findMany({
    where: eq(schema.bounties.creatorAlienId, alienId),
    orderBy: [desc(schema.bounties.createdAt)],
  });
}

export async function getOpenBounties(limit = 50): Promise<Bounty[]> {
  return db.query.bounties.findMany({
    where: eq(schema.bounties.status, "open"),
    orderBy: [desc(schema.bounties.createdAt)],
    limit,
  });
}

export async function claimBounty(
  bountyId: string,
  claimerAlienId: string,
): Promise<Bounty | null> {
  const [updated] = await db
    .update(schema.bounties)
    .set({
      status: "claimed",
      claimedByAlienId: claimerAlienId,
    })
    .where(
      and(
        eq(schema.bounties.id, bountyId),
        eq(schema.bounties.status, "open"),
        ne(schema.bounties.creatorAlienId, claimerAlienId),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function completeBounty(
  bountyId: string,
  creatorAlienId: string,
): Promise<Bounty | null> {
  const [updated] = await db
    .update(schema.bounties)
    .set({ status: "completed" })
    .where(
      and(
        eq(schema.bounties.id, bountyId),
        eq(schema.bounties.creatorAlienId, creatorAlienId),
        eq(schema.bounties.status, "claimed"),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function deleteBounty(
  bountyId: string,
  creatorAlienId: string,
): Promise<boolean> {
  const result = await db
    .delete(schema.bounties)
    .where(
      and(
        eq(schema.bounties.id, bountyId),
        eq(schema.bounties.creatorAlienId, creatorAlienId),
      ),
    )
    .returning();
  return result.length > 0;
}
