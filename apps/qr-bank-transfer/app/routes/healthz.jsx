import prisma from "../db.server";

/**
 * Health check for the hosting platform.
 *
 * Touches the database rather than only returning 200: an app that serves
 * pages but cannot reach Postgres is not healthy, and a check that ignores
 * that keeps routing traffic to a broken instance.
 */
export const loader = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("health check failed:", error.message);
    return Response.json({ ok: false, error: "database unreachable" }, { status: 503 });
  }
};
