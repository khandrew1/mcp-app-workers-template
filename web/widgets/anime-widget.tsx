import { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useApp } from "@modelcontextprotocol/ext-apps/react";

import "../index.css";
import { AnimeCard, type AnimeCardProps } from "../components/anime-card";
import type { AnimePayload, AnimeStructuredContent } from "../../types";

function toAnimeCardProps(anime: AnimePayload | null): AnimeCardProps | null {
  if (!anime) return null;

  const {
    image_url,
    title_english,
    rating,
    score,
    synopsis,
    year,
    genres,
    studios,
  } = anime;

  return {
    image_url: image_url ?? undefined,
    title_english: title_english ?? undefined,
    rating: rating ?? undefined,
    score: score ?? undefined,
    synopsis: synopsis ?? undefined,
    year,
    genres: genres.length ? genres : undefined,
    studios: studios.length ? studios : undefined,
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

  const {
    app,
    isConnected,
    error: appError,
  } = useApp({
    appInfo: {
      name: "anime-detail-widget",
      version: "0.0.1",
    },
    capabilities: {},
    onAppCreated: (appInstance) => {
      const handleQueryUpdate = ({
        arguments: args,
      }: {
        arguments?: { query?: string };
      }) => {
        const incomingQuery = args?.query?.trim();
        if (!incomingQuery) return;

        setQuery(incomingQuery);
        setStatus("loading");
        setError(null);
      };

      appInstance.ontoolinput = (params) => handleQueryUpdate(params);

      appInstance.ontoolinputpartial = (params) => handleQueryUpdate(params);

      appInstance.ontoolresult = ({ structuredContent }) => {
        const { anime: animePayload, query: incomingQuery } =
          structuredContent as AnimeStructuredContent;

        setAnimeUrl(animePayload?.url ?? null);
        setQuery(incomingQuery);

        const animeCard = toAnimeCardProps(animePayload);
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

    app.sendOpenLink({ url: animeUrl }).catch(() => {
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

window.addEventListener("load", () => {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }

  createRoot(root).render(<AnimeWidget />);
});
