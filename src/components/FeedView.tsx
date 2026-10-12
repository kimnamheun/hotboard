"use client";

import { useEffect, useMemo, useState } from "react";
import type { BoardFeed, Post } from "@/lib/types";
import styles from "./FeedView.module.css";

type SortKey = "likes" | "comments" | "views" | "latest";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "likes", label: "추천순" },
  { key: "comments", label: "댓글순" },
  { key: "views", label: "조회순" },
  { key: "latest", label: "최신순" },
];

const compare: Record<SortKey, (a: Post, b: Post) => number> = {
  likes: (a, b) => b.likes - a.likes || b.comments - a.comments || b.views - a.views,
  comments: (a, b) => b.comments - a.comments || b.likes - a.likes || b.views - a.views,
  views: (a, b) => b.views - a.views || b.likes - a.likes,
  latest: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
};

const STORAGE_KEY = "hotboard:view";

/** 서버·브라우저가 같은 문자열을 내도록 KST 를 직접 계산 (Intl 출력 차이로 인한 hydration 불일치 방지) */
function formatKst(iso: string) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export default function FeedView({ feeds, fetchedAt }: { feeds: BoardFeed[]; fetchedAt: string }) {
  const [sort, setSort] = useState<SortKey>("likes");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (SORTS.some((s) => s.key === saved.sort)) setSort(saved.sort);
      if (saved.filter === "all" || feeds.some((f) => f.feedId === saved.filter)) setFilter(saved.filter);
    } catch {
      /* 저장소 없음 — 기본값 사용 */
    }
  }, [feeds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sort, filter }));
    } catch {
      /* 무시 */
    }
  }, [sort, filter]);

  const visible = useMemo(
    () =>
      feeds
        .filter((f) => filter === "all" || f.feedId === filter)
        .map((f) => ({ ...f, posts: [...f.posts].sort(compare[sort]) })),
    [feeds, filter, sort],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brandRow}>
          <h1 className={styles.brand}>Hotboard</h1>
          <span className={styles.updated}>{formatKst(fetchedAt)} 기준 · 10분마다 갱신</span>
        </div>
        <p className={styles.sub}>게시판별 최신글을 반응(추천·댓글·조회) 기준으로 정렬해 보여줍니다.</p>

        <nav className={styles.chips} aria-label="게시판">
          <button
            className={`${styles.chip} ${filter === "all" ? styles.chipOn : ""}`}
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
          >
            전체
          </button>
          {feeds.map((f) => (
            <button
              key={f.feedId}
              className={`${styles.chip} ${filter === f.feedId ? styles.chipOn : ""}`}
              onClick={() => setFilter(f.feedId)}
              aria-pressed={filter === f.feedId}
            >
              {f.board.name}
            </button>
          ))}
        </nav>

        <div className={styles.sorts} role="radiogroup" aria-label="정렬">
          {SORTS.map((s) => (
            <button
              key={s.key}
              role="radio"
              aria-checked={sort === s.key}
              className={`${styles.sort} ${sort === s.key ? styles.sortOn : ""}`}
              onClick={() => setSort(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <main className={`${styles.grid} ${filter !== "all" ? styles.single : ""}`}>
        {visible.map((f) => (
          <section key={f.feedId} className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                <span className={styles.source}>{f.sourceName}</span>
                {f.board.name}
              </h2>
              <a className={styles.origin} href={f.board.url} target="_blank" rel="noopener noreferrer">
                원본 ↗
              </a>
            </div>

            {f.error ? (
              <p className={styles.error}>불러오지 못했습니다 ({f.error})</p>
            ) : f.posts.length === 0 ? (
              <p className={styles.empty}>글이 없습니다</p>
            ) : (
              <ol className={styles.list}>
                {f.posts.map((p, i) => (
                  <li key={p.id} className={styles.item}>
                    <span className={styles.rank}>{i + 1}</span>
                    <div className={styles.body}>
                      <a className={styles.title} href={p.url} target="_blank" rel="noopener noreferrer">
                        {p.title}
                      </a>
                      <div className={styles.meta}>
                        <span>{p.author}</span>
                        <span>{formatKst(p.publishedAt)}</span>
                      </div>
                    </div>
                    <div className={styles.stats}>
                      <span className={`${styles.like} ${p.likes > 0 ? styles.likeOn : ""}`} title="추천">
                        추천 {p.likes}
                      </span>
                      <span title="댓글">댓글 {p.comments}</span>
                      <span title="조회">조회 {p.views.toLocaleString("ko-KR")}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </main>

      <footer className={styles.footer}>
        각 사이트의 공개 RSS 로 가져온 제목과 링크만 표시합니다. 글 내용은 원본 사이트에서 확인하세요.
      </footer>
    </div>
  );
}
