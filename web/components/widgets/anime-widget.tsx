import { useState, useCallback } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";

import "../../index.css";
import { AnimeCard, type AnimeCardProps } from "../anime-card";

type ToolInputParams = {
  arguments?: Record<string, unknown>;
};

function parseAnimeFromResult(result: unknown): AnimeCardProps | null {
  if (!result || typeof result !== "object") return null;
  const payload =
    (result as { structuredContent?: unknown; anime?: unknown })
      .structuredContent ?? result;
  const anime = (payload as { anime?: unknown }).anime ?? payload;

  if (!anime || typeof anime !== "object") return null;

  const animeObj = anime as Record<string, unknown>;

  return {
    image_url:
      typeof animeObj.image_url === "string"
        ? animeObj.image_url
        : undefined,
    title_english:
      typeof animeObj.title_english === "string"
        ? animeObj.title_english
        : undefined,
    rating:
      typeof animeObj.rating === "string" ? animeObj.rating : undefined,
    score:
      typeof animeObj.score === "number" ? animeObj.score : undefined,
    synopsis:
      typeof animeObj.synopsis === "string" ? animeObj.synopsis : undefined,
    year:
      typeof animeObj.year === "number"
        ? animeObj.year
        : animeObj.year === null
          ? null
          : undefined,
    genres: Array.isArray(animeObj.genres)
      ? (animeObj.genres.filter(
          (genre): genre is string => typeof genre === "string",
        ))
      : undefined,
    studios: Array.isArray(animeObj.studios)
      ? (animeObj.studios.filter(
          (studio): studio is string => typeof studio === "string",
        ))
      : undefined,
  };
}

export default function AnimeWidget() {
  const [anime, setAnime] = useState<AnimeCardProps | null>(null);
  const [query, setQuery] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [animeUrl, setAnimeUrl] = useState<string | null>(null);

  const { app, isConnected, error: appError } = useApp({
    appInfo: {
      name: "anime-detail-widget",
      version: "0.0.1",
    },
    capabilities: {},
    onAppCreated: (appInstance) => {
      appInstance.ontoolinput = (params) => {
        const incomingQuery = params.arguments?.query;
        if (
          typeof incomingQuery === "string" &&
          incomingQuery.trim().length > 0
        ) {
          setQuery(incomingQuery);
          setStatus("loading");
          setError(null);
        }
      };

      appInstance.ontoolinputpartial = (params) => {
        const incomingQuery = params.arguments?.query;
        if (
          typeof incomingQuery === "string" &&
          incomingQuery.trim().length > 0
        ) {
          setQuery(incomingQuery);
          setStatus("loading");
          setError(null);
        }
      };

      appInstance.ontoolresult = (params) => {
        const animeCard = parseAnimeFromResult(params);
        const payload =
          params &&
          typeof params === "object"
            ? (params as { structuredContent?: unknown })
            : null;
        const structuredContent =
          payload?.structuredContent &&
          typeof payload.structuredContent === "object"
            ? (payload.structuredContent as Record<string, unknown>)
            : null;
        const incomingQuery =
          typeof structuredContent?.query === "string"
            ? structuredContent.query
            : undefined;

        // Extract URL from structured content
        const url =
          structuredContent?.anime &&
          typeof structuredContent.anime === "object"
            ? (structuredContent.anime as Record<string, unknown>).url
            : null;
        if (typeof url === "string") {
          setAnimeUrl(url);
        }

        if (incomingQuery) {
          setQuery(incomingQuery);
        }

        if (animeCard) {
          setAnime(animeCard);
          setStatus("ready");
          setError(null);
        } else {
          setStatus("error");
          setError("No anime details were returned.");
        }
      };
    },
  });

  const handleOpenMyAnimeList = useCallback(() => {
    if (!app || !animeUrl) return;

    app
      .sendOpenLink({ url: animeUrl })
      .catch(() => {
        setStatus("error");
        setError("Host rejected ui/open-link request.");
      });
  }, [app, animeUrl]);

  if (appError) {
    return (
      <div className="bg-background text-foreground min-h-screen">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Error initializing widget: {appError.message}
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-background text-foreground min-h-screen">
        <div className="rounded-lg border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
          Connecting to MCP host...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      {status === "error" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error ?? "Something went wrong while loading this anime."}
        </div>
      )}

      {anime ? (
        <AnimeCard
          {...anime}
          onOpenMyAnimeList={animeUrl ? handleOpenMyAnimeList : undefined}
          className="shadow-md"
        />
      ) : (
        <div className="rounded-lg border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
          Waiting for anime data from the host...
        </div>
      )}
    </div>
  );
}
