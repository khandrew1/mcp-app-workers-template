import {
  CalendarDays,
  ExternalLink,
  Shield,
  Sparkles,
  Star,
} from "lucide-react";
import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AnimeCardProps = {
  image_url?: string;
  title_english?: string;
  rating?: string;
  score?: number;
  synopsis?: string;
  year?: number | null;
  genres?: string[];
  studios?: string[];
  className?: string;
  onOpenMyAnimeList?: () => void;
};

type MetaChipProps = {
  icon: React.ReactNode;
  label: string;
};

function MetaChip({ icon, label }: MetaChipProps) {
  return (
    <span className="bg-muted text-foreground/80 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none shadow-[0_0_0_1px_var(--border)]">
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

export function AnimeCard({
  image_url,
  title_english,
  rating,
  score,
  synopsis,
  year,
  genres,
  studios,
  className,
  onOpenMyAnimeList,
}: AnimeCardProps) {
  const studiosLine = studios && studios.length > 0 ? studios.join(", ") : null;

  return (
    <Card className={cn("w-full bg-card/80", className)}>
      <CardContent className="relative flex min-w-0 items-stretch gap-4 p-5 sm:gap-6 sm:p-6">
        {typeof score === "number" && (
          <div className="bg-amber-50 text-amber-900 absolute right-5 top-5 z-10 flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold shadow-[0_0_0_1px_rgba(251,191,36,0.35)] sm:right-6 sm:top-6">
            <Star className="size-4 fill-amber-400 text-amber-500" />
            <span>{score.toFixed(1)}</span>
          </div>
        )}
        <div className="relative aspect-[2/3] w-[180px] min-w-[180px] shrink-0 overflow-hidden rounded-lg border bg-gradient-to-br from-muted to-muted/50 shadow-inner sm:w-[240px] sm:min-w-[240px]">
          {image_url ? (
            <img
              src={image_url}
              alt={`${title_english || "Anime"} poster`}
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.08),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(0,0,0,0.06),transparent_35%),radial-gradient(circle_at_50%_60%,rgba(0,0,0,0.08),transparent_35%)] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              No Poster
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base leading-tight sm:text-lg">
                {title_english || "Anime Title"}
              </CardTitle>
              {studiosLine && (
                <CardDescription className="text-xs">
                  {studiosLine}
                </CardDescription>
              )}
            </div>
          </div>

          {title_english && onOpenMyAnimeList && (
            <button
              type="button"
              onClick={() => {
                onOpenMyAnimeList();
              }}
              className="text-primary inline-flex items-center gap-1 text-sm font-semibold underline transition-colors hover:underline"
            >
              Open in MyAnimeList
              <ExternalLink className="size-4" aria-hidden />
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {year && (
              <MetaChip
                icon={<CalendarDays className="size-3.5" aria-hidden />}
                label={year.toString()}
              />
            )}
            {rating && (
              <MetaChip
                icon={<Shield className="size-3.5" aria-hidden />}
                label={rating}
              />
            )}
            {genres && genres.length > 0 && (
              <MetaChip
                icon={<Sparkles className="size-3.5" aria-hidden />}
                label={
                  genres.length > 2
                    ? `${genres.slice(0, 2).join(" • ")} +${genres.length - 2}`
                    : genres.join(" • ")
                }
              />
            )}
          </div>

          {synopsis && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {synopsis}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
