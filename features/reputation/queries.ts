import { eq, and, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Cast a vote on a post
 */
export async function castVote(
  postId: string,
  voterAlienId: string,
  authorAlienId: string,
  direction: "up" | "down",
  voterWeight: number = 1
): Promise<{ success: boolean; changed: boolean }> {
  // Check if voter already voted on this post
  const existing = await db.query.votes.findFirst({
    where: and(
      eq(schema.votes.postId, postId),
      eq(schema.votes.voterAlienId, voterAlienId)
    ),
  });

  if (existing) {
    if (existing.direction === direction) {
      // Same vote - remove it (toggle off)
      await db.delete(schema.votes)
        .where(eq(schema.votes.id, existing.id));
      return { success: true, changed: true };
    } else {
      // Different vote - update it
      await db.update(schema.votes)
        .set({ direction, weight: voterWeight })
        .where(eq(schema.votes.id, existing.id));
      return { success: true, changed: true };
    }
  }

  // New vote
  await db.insert(schema.votes).values({
    postId,
    voterAlienId,
    authorAlienId,
    direction,
    weight: voterWeight,
  });

  return { success: true, changed: true };
}

/**
 * Get vote counts for a post
 */
export async function getPostVotes(postId: string): Promise<{
  up: number;
  down: number;
  score: number;
  userVote: string | null;
  controversy: number; // 0-1, higher = more controversial
}> {
  const votes = await db.query.votes.findMany({
    where: eq(schema.votes.postId, postId),
  });

  let up = 0;
  let down = 0;
  let totalWeight = 0;

  for (const v of votes) {
    const w = v.weight ?? 1;
    if (v.direction === "up") up += w;
    else down += w;
    totalWeight += w;
  }

  // Controversy: high when up and down are similar and high
  const total = up + down;
  const score = up - down;
  
  // Wilson score or simple controversy metric
  // High controversy when ratio is near 0.5 and total votes are high
  let controversy = 0;
  if (total > 0) {
    const ratio = Math.min(up, down) / (total / 2);
    controversy = ratio * Math.min(total / 10, 1); // scales with vote count
  }

  return { up, down, score, userVote: null, controversy };
}

/**
 * Calculate user's karma/reputation
 * Returns: karma, cooldown multiplier, vote weight
 */
export async function getUserReputation(
  alienId: string
): Promise<{
  karma: number;
  cooldownMultiplier: number; // < 1 = faster, > 1 = slower
  voteWeight: number; // higher = more influential votes
}> {
  // Get all votes on this user's posts
  const votesOnUser = await db.query.votes.findMany({
    where: eq(schema.votes.authorAlienId, alienId),
  });

  // Get all votes cast BY this user (to calculate their vote weight)
  const votesByUser = await db.query.votes.findMany({
    where: eq(schema.votes.voterAlienId, alienId),
  });

  // Calculate karma from received votes
  let karma = 0;
  const voteCounts: Record<string, { up: number; down: number }> = {};

  for (const v of votesOnUser) {
    const w = v.weight ?? 1;
    
    // Track per-post votes for controversy calculation
    if (!voteCounts[v.postId]) {
      voteCounts[v.postId] = { up: 0, down: 0 };
    }
    if (v.direction === "up") {
      voteCounts[v.postId].up += w;
    } else {
      voteCounts[v.postId].down += w;
    }
  }

  // Calculate karma with controversy penalty
  for (const postId in voteCounts) {
    const { up, down } = voteCounts[postId];
    const total = up + down;
    
    // Controversy factor: controversial posts count less
    const ratio = total > 0 ? Math.min(up, down) / (total / 2) : 0;
    const controversyPenalty = 1 - (ratio * 0.8); // up to 80% reduction for controversial
    
    karma += (up - down) * controversyPenalty;
  }

  // Karma from own behavior (voting thoughtfully)
  // Users who vote more get slightly higher weight (engagement bonus)
  const engagementBonus = Math.min(votesByUser.length / 100, 0.5);
  
  // Calculate vote weight based on karma
  // Negative karma = weak votes, positive = strong votes
  let voteWeight = 1;
  if (karma < -10) voteWeight = 0.3;
  else if (karma < 0) voteWeight = 0.5;
  else if (karma < 10) voteWeight = 1;
  else if (karma < 50) voteWeight = 1.5;
  else voteWeight = 2;
  
  voteWeight += engagementBonus;

  // Calculate cooldown multiplier
  // Positive karma = faster posting, negative = slower
  let cooldownMultiplier = 1;
  if (karma < -20) cooldownMultiplier = 3;      // 3x slower (15 min)
  else if (karma < -10) cooldownMultiplier = 2; // 2x slower (10 min)
  else if (karma < 0) cooldownMultiplier = 1.5; // 1.5x slower (7.5 min)
  else if (karma < 10) cooldownMultiplier = 1;  // normal (5 min)
  else if (karma < 50) cooldownMultiplier = 0.5; // 2x faster (2.5 min)
  else cooldownMultiplier = 0.3;                  // 3x faster (1.5 min)

  return {
    karma: Math.round(karma),
    cooldownMultiplier,
    voteWeight: Math.round(voteWeight * 10) / 10,
  };
}

/**
 * Get cooldown seconds for a user
 */
export async function getUserCooldown(alienId: string): Promise<number> {
  const rep = await getUserReputation(alienId);
  const baseCooldown = 300; // 5 minutes base
  return Math.round(baseCooldown * rep.cooldownMultiplier);
}

/**
 * Get vote summary for a list of posts with current user's votes
 */
export async function getVotesForPosts(
  postIds: string[],
  currentUserAlienId?: string
): Promise<Record<string, {
  up: number;
  down: number;
  score: number;
  userVote: "up" | "down" | null;
}>> {
  if (postIds.length === 0) return {};

  const votes = await db.query.votes.findMany({
    where: sql`${schema.votes.postId} IN ${postIds}`,
  });

  const result: Record<string, { up: number; down: number; score: number; userVote: "up" | "down" | null }> = {};

  // Initialize all posts
  for (const pid of postIds) {
    result[pid] = { up: 0, down: 0, score: 0, userVote: null };
  }

  // Aggregate votes
  for (const v of votes) {
    const w = v.weight ?? 1;
    if (!result[v.postId]) continue;
    
    if (v.direction === "up") {
      result[v.postId].up += w;
    } else {
      result[v.postId].down += w;
    }
    
    if (v.voterAlienId === currentUserAlienId) {
      result[v.postId].userVote = v.direction as "up" | "down";
    }
  }

  // Calculate scores
  for (const pid of postIds) {
    result[pid].score = result[pid].up - result[pid].down;
  }

  return result;
}
