import { useEffect, useState } from "react";
import { loadChapter } from "../bible-data/loader";
import type { ChapterData } from "../bible-data/types";

interface ChapterState {
  data: ChapterData | null;
  loading: boolean;
  error: string | null;
}

export function useChapter(translationId: string, bookId: string, chapter: number) {
  const [state, setState] = useState<ChapterState>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    loadChapter(translationId, bookId, chapter)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: String(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [translationId, bookId, chapter]);

  return state;
}
