# MCP App Workers Template

A production-ready template for building Model Context Protocol (MCP) servers on Cloudflare Workers with interactive UI widgets. This template demonstrates how to create MCP tools that return rich, interactive HTML widgets using React, Tailwind CSS, and the MCP Extensions Apps API.

## Overview

This template provides a complete foundation for building MCP servers that expose:

- **MCP Tools**: Server-side functions that can be called by MCP clients
- **UI Widgets**: Interactive HTML widgets that can be rendered in MCP-compatible hosts
- **Resource Handlers**: Dynamic resource endpoints that serve widget HTML with proper CSP configuration

The example implementation includes an anime search tool that queries the Jikan API (MyAnimeList) and displays results in a beautiful, interactive widget.

## Features

- ✅ **MCP Server Implementation**: Full MCP server using `@modelcontextprotocol/sdk`
- ✅ **Interactive Widgets**: React-based UI widgets with Tailwind CSS styling
- ✅ **Cloudflare Workers**: Deploy to Cloudflare's edge network for global performance
- ✅ **Asset Management**: Built-in asset serving for widget HTML files
- ✅ **Type Safety**: Full TypeScript support with Cloudflare Workers type generation
- ✅ **Modern Build Pipeline**: Vite-based build system with single-file output
- ✅ **CSP Configuration**: Content Security Policy support for widget security
- ✅ **MCP Extensions Apps**: Integration with `@modelcontextprotocol/ext-apps` for widget communication

## Prerequisites

- **Node.js** 18+ and npm
- **Cloudflare Account** (for deployment)
- **Wrangler CLI** (installed via npm)

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/MCPJam/mcp-app-workers-template.git
   cd mcp-app-workers-template
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Generate Cloudflare Workers types**:

   ```bash
   npm run cf-typegen
   ```

   This generates TypeScript types for Cloudflare Workers bindings. The types are used in `server/index.ts` when instantiating Hono with `CloudflareBindings`.

## Development

### Local Development

1. **Build widgets** (required before running dev server):

   ```bash
   npm run build
   ```

2. **Start the development server**:

   ```bash
   npm run dev
   ```

   This starts Wrangler's development server. The MCP endpoint will be available at `http://localhost:8787/mcp`.

### Building Widgets

Widgets are built using Vite and output as single-file HTML bundles:

```bash
npm run build
```

The build process:

- Compiles React/TypeScript components
- Bundles all dependencies into a single file
- Applies Tailwind CSS
- Outputs to `web/dist/widgets/`

To build a specific widget, set the `INPUT` environment variable:

```bash
INPUT=widgets/anime-detail-widget.html npm run build
```

## Deployment

### Deploy to Cloudflare Workers

1. **Authenticate with Wrangler** (first time only):

   ```bash
   npx wrangler login
   ```

2. **Build widgets**:

   ```bash
   npm run build
   ```

3. **Deploy**:

   ```bash
   npm run deploy
   ```

   This will:
   - Build the widgets
   - Deploy the Worker to Cloudflare
   - Upload widget assets to the Worker's ASSETS binding

4. **Get your deployment URL**:
   After deployment, Wrangler will output your Worker URL. Your MCP endpoint will be at:
   ```
   https://<your-worker-name>.<your-subdomain>.workers.dev/mcp
   ```

### Environment Configuration

The project uses `wrangler.jsonc` for configuration. Key settings:

- **name**: Worker name (change this to your project name)
- **main**: Entry point (`server/index.ts`)
- **assets**: Directory containing built widgets (`./web/dist/widgets`)
- **compatibility_date**: Cloudflare Workers compatibility date

## Project Structure

```
mcp-app-workers-template/
├── server/                    # Server-side code
│   ├── index.ts              # Hono router and MCP endpoint handler
│   └── mcp.ts                # MCP server implementation
├── web/                       # Frontend/widget code
│   ├── components/           # React components
│   │   ├── anime-card.tsx   # Anime display component
│   │   └── ui/              # UI component library
│   ├── widgets/             # Widget entry points
│   │   ├── anime-detail-widget.html
│   │   └── anime-widget.tsx
│   ├── lib/                 # Utilities
│   └── index.css            # Global styles
├── wrangler.jsonc           # Cloudflare Workers configuration
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## How It Works

### MCP Server Setup

The MCP server (`server/mcp.ts`) registers:

1. **Tools**: Server-side functions that can be called by MCP clients
   - Example: `get-anime-detail` - searches for anime and returns structured data

2. **Resources**: Dynamic endpoints that serve widget HTML
   - Example: `ui://widget/anime-detail-widget.html` - serves the anime widget HTML

### Widget Communication

Widgets use the MCP Extensions Apps API (`@modelcontextprotocol/ext-apps`) to:

- **Receive tool inputs**: Listen for when tools are called
- **Receive tool results**: Get structured data from tool execution
- **Send commands**: Request actions from the host (e.g., open links)

### Widget Registration

Widgets are registered in `server/mcp.ts` using `registerWidget()`:

```typescript
registerWidget(server, assets, {
  name: "anime-detail-widget",
  htmlPath: "/anime-detail-widget.html",
  resourceUri: "ui://widget/anime-detail-widget.html",
  descripition: "Interactive anime detail widget UI",
  resourceDomains: ["https://cdn.myanimelist.net/"], // CSP allowed domains
});
```

### Tool-to-Widget Linking

Tools can specify which widget to display using `_meta`:

```typescript
server.registerTool(
  "get-anime-detail",
  {
    // ... tool config
    _meta: {
      "ui/resourceUri": "ui://widget/anime-detail-widget.html",
    },
  },
  // ... handler
);
```

## Adding New Widgets

1. **Create widget HTML entry point** in `web/widgets/`:

   ```html
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>My Widget</title>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="./my-widget.tsx"></script>
     </body>
   </html>
   ```

2. **Create widget React component** in `web/widgets/`:

   ```typescript
   import { useApp } from "@modelcontextprotocol/ext-apps/react";
   // ... implement widget logic
   ```

3. **Build the widget**:

   ```bash
   INPUT=widgets/my-widget.html npm run build
   ```

4. **Register the widget** in `server/mcp.ts`:

   ```typescript
   registerWidget(server, assets, {
     name: "my-widget",
     htmlPath: "/my-widget.html",
     resourceUri: "ui://widget/my-widget.html",
     descripition: "My widget description",
     resourceDomains: ["https://example.com"], // Optional: CSP domains
   });
   ```

5. **Link tool to widget** (optional):
   ```typescript
   server.registerTool(
     "my-tool",
     {
       // ... config
       _meta: {
         "ui/resourceUri": "ui://widget/my-widget.html",
       },
     },
     handler,
   );
   ```

## Configuration

### Widget Configuration Options

When registering a widget, you can configure:

- **name**: Unique widget identifier
- **htmlPath**: Path to HTML file in ASSETS binding
- **resourceUri**: MCP resource URI (must start with `ui://widget/`)
- **descripition**: Widget description
- **connectDomains**: CSP allowed domains for fetch/XHR/WebSocket
- **resourceDomains**: CSP allowed domains for images, scripts, etc.
- **domain**: Custom domain for widget
- **prefersBorder**: Whether widget prefers a border

### CSP (Content Security Policy)

Widgets support CSP configuration for security:

```typescript
registerWidget(server, assets, {
  // ...
  connectDomains: ["https://api.example.com"], // For API calls
  resourceDomains: ["https://cdn.example.com"], // For images/assets
});
```

## Technologies Used

- **[Hono](https://hono.dev/)**: Fast web framework for Cloudflare Workers
- **[Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)**: MCP server implementation
- **[MCP Extensions Apps](https://github.com/modelcontextprotocol/ext-apps)**: Widget communication API
- **[React](https://react.dev/)**: UI framework for widgets
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework
- **[Vite](https://vitejs.dev/)**: Build tool and dev server
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript
- **[Cloudflare Workers](https://workers.cloudflare.com/)**: Edge computing platform
- **[Wrangler](https://developers.cloudflare.com/workers/wrangler/)**: Cloudflare Workers CLI

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build widgets (requires `INPUT` env var)
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate Cloudflare Workers TypeScript types
- `npm run format` - Format code with Prettier

## Troubleshooting

### Widget not loading

- Ensure widgets are built: `npm run build`
- Check that the HTML file exists in `web/dist/widgets/`
- Verify the `htmlPath` in widget registration matches the actual file path

### MCP connection issues

- Verify the endpoint URL is correct: `https://your-worker.workers.dev/mcp`
- Check Cloudflare Workers logs: `npx wrangler tail`
- Ensure the MCP client supports HTTP/SSE transport

### Type errors

- Run `npm run cf-typegen` to regenerate types
- Ensure `CloudflareBindings` is imported from generated types
