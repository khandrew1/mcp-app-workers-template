import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AnimePayload } from "../types.js";

type AssetsBinding = {
  fetch: (request: Request | string) => Promise<Response>;
};

type WidgetConfig = {
  name: string;
  htmlPath: string;
  resourceUri: string;
  descripition: string;
  connectDomains?: string[]; // Origins for fetch/XHR/WebSocket
  resourceDomains?: string[]; // Origins for images, scripts, etc
  domain?: string;
  prefersBorder?: boolean;
};

async function loadHtml(
  assets: AssetsBinding | undefined,
  htmlPath: string,
): Promise<string> {
  try {
    if (!assets) {
      throw new Error("ASSETS binding not available");
    }

    const buildRequest = (path: string) =>
      // Assets fetcher expects an absolute URL, so use a placeholder origin.
      new Request(new URL(path, "https://assets.invalid").toString());

    // Fetch HTML file from the ASSETS binding
    const htmlResponse = await assets.fetch(buildRequest(htmlPath));

    if (!htmlResponse.ok) {
      throw new Error(`Failed to fetch HTML: ${htmlResponse.status}`);
    }

    return await htmlResponse.text();
  } catch (error) {
    console.error("Failed to load HTML:", error);
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Error</title>
  </head>
  <body>
    <div>Error loading widget HTML</div>
  </body>
</html>`;
  }
}

function registerWidget(
  server: McpServer,
  assets: AssetsBinding | undefined,
  config: WidgetConfig,
) {
  server.registerResource(
    config.name,
    config.resourceUri,
    {
      description: config.descripition,
      mimeType: "text/html+mcp",
    },
    async (uri) => {
      const htmlContent = await loadHtml(assets, config.htmlPath);

      const meta: {
        ui?: {
          csp?: {
            connectDomains?: string[];
            resourceDomains?: string[];
          };
          domain?: string;
          prefersBorder?: boolean;
        };
      } = {};

      if (config.connectDomains || config.resourceDomains) {
        meta.ui = {
          ...meta.ui,
          csp: {},
        };
        if (config.connectDomains) {
          meta.ui!.csp!.connectDomains = config.connectDomains;
        }
        if (config.resourceDomains) {
          meta.ui!.csp!.resourceDomains = config.resourceDomains;
        }
      }

      if (config.domain || config.prefersBorder !== undefined) {
        if (!meta.ui) {
          meta.ui = {};
        }
        if (config.domain) {
          meta.ui.domain = config.domain;
        }
        if (config.prefersBorder !== undefined) {
          meta.ui.prefersBorder = config.prefersBorder;
        }
      }

      const content: {
        uri: string;
        mimeType: string;
        text: string;
        _meta?: typeof meta;
      } = {
        uri: uri.href,
        mimeType: "text/html+mcp",
        text: htmlContent,
      };

      if (
        meta.ui &&
        (meta.ui.csp ||
          meta.ui.domain !== undefined ||
          meta.ui.prefersBorder !== undefined)
      ) {
        content._meta = meta;
      }

      return {
        contents: [content],
      };
    },
  );
}

export function createMcpServer(assets?: AssetsBinding) {
  const server = new McpServer({
    name: "mcp-app-workers-template",
    version: "0.0.1",
  });

  registerWidget(server, assets, {
    name: "anime-detail-widget",
    htmlPath: "/anime-detail-widget.html",
    resourceUri: "ui://widget/anime-detail-widget.html",
    descripition: "Interactive anime detail widget UI",
    resourceDomains: ["https://cdn.myanimelist.net/"],
  });

  server.registerTool(
    "get-anime-detail",
    {
      description:
        "Search for anime by title and return details from MyAnimeList",
      inputSchema: z.object({
        query: z
          .string()
          .min(1, "Please provide an anime title")
          .describe("Anime title to search for"),
      }),
      _meta: {
        "ui/resourceUri": "ui://widget/anime-detail-widget.html",
      },
    },
    async ({ query }) => {
      try {
        const response = await fetch(
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&sfw=true`,
        );

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
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
          return {
            content: [
              {
                type: "text",
                text: `No results found for "${query}".`,
              },
            ],
            structuredContent: {
              query,
              anime: null,
            },
          };
        }

        const firstResult = data.data[0];

        const animePayload: AnimePayload = {
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

        return {
          content: [
            {
              type: "text",
              text: `Showing results for "${query}": ${animePayload.title_english || "Unknown title"}.`,
            },
          ],
          structuredContent: {
            query,
            anime: animePayload,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch anime data: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  return server;
}
