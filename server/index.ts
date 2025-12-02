import { Hono } from "hono";
import { createMcpHandler } from "agents/mcp";
import { createMcpServer } from "./mcp";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) =>
  c.html(
    `<main style="font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 4rem auto; padding: 0 1.5rem; line-height: 1.6;">
      <h1 style="font-size: 1.6rem; margin-bottom: 0.5rem;">MCP Server Template</h1>
      <p>This worker exposes an MCP endpoint at <code>/mcp</code>. Connect with an MCP-compatible host to use the widgets.</p>
      <p>If you reached this page in a browser, there's nothing else to do here.</p>
    </main>`,
  ),
);

app.get("/anime/search", async (c) => {
  const query = c.req.query("q");

  if (!query) {
    return c.json({ error: "Query parameter 'q' is required" }, 400);
  }

  try {
    const response = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&sfw=true`,
    );

    if (!response.ok) {
      return c.json(
        { error: `API request failed: ${response.statusText}` },
        { status: response.status as 400 | 401 | 403 | 404 | 500 },
      );
    }

    const data = (await response.json()) as {
      data?: Array<{
        images?: {
          jpg?: {
            image_url?: string;
          };
        };
        url?: string;
        title_english?: string;
        rating?: string;
        score?: number;
        synopsis?: string;
        year?: number;
        genres?: Array<{ name: string }>;
        studios?: Array<{ name: string }>;
      }>;
    };

    if (!data.data || data.data.length === 0) {
      return c.json({ error: "No anime found" }, 404);
    }

    const firstResult = data.data[0];

    const result = {
      image_url: firstResult.images?.jpg?.image_url || null,
      url: firstResult.url || null,
      title_english: firstResult.title_english || null,
      rating: firstResult.rating || null,
      score: firstResult.score || null,
      synopsis: firstResult.synopsis || null,
      year: firstResult.year || null,
      genres: firstResult.genres?.map((g) => g.name) || [],
      studios: firstResult.studios?.map((s) => s.name) || [],
    };

    return c.json(result);
  } catch (error) {
    return c.json(
      {
        error: `Failed to fetch anime data: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      500,
    );
  }
});

app.all("/mcp", async (c) => {
  // Create server with ASSETS binding
  const server = createMcpServer(c.env.ASSETS);
  const mcpFetchHandler = createMcpHandler(server);
  return mcpFetchHandler(
    c.req.raw,
    c.env,
    c.executionCtx as ExecutionContext<CloudflareBindings>,
  );
});

export default app;
