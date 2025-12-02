export type AnimePayload = {
  image_url: string | null;
  url: string | null;
  title_english: string | null;
  rating: string | null;
  score: number | null;
  synopsis: string | null;
  year: number | null;
  genres: string[];
  studios: string[];
};

export type AnimeStructuredContent = {
  query: string;
  anime: AnimePayload | null;
};
