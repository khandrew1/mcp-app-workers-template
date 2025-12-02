import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type AssetsBinding = {
  fetch: (request: Request | string) => Promise<Response>;
};

type WidgetConfig = {
  name: string;
  htmlPath: string;
  resourceUri: string;
  descripition: string;
  connectDomains?: string[];  // Origins for fetch/XHR/WebSocket
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
    config: WidgetConfig
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
            
            if (meta.ui && (meta.ui.csp || meta.ui.domain !== undefined || meta.ui.prefersBorder !== undefined)) {
                content._meta = meta;
            }
            
            return {
                contents: [content],
            };
        }
    );
}

export function createMcpServer(assets?: AssetsBinding) {
    const server = new McpServer({
        name: "mcp-app-workers-template",
        version: "0.0.1"
    });

    return server;
}