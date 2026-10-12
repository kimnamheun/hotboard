import { XMLParser } from "fast-xml-parser";
import type { Board, Post, Source } from "../types";
import { REVALIDATE_SECONDS, USER_AGENT } from "../config";

// 뽐뿌는 게시판 목록 화면(zboard.php)을 프로그램 접근 시 403 으로 막고, 공식 RSS 는 허용한다.
// → RSS(rss.php?id=게시판) 만 사용. 게시판당 최신 13~15건.
const BASE = "https://www.ppomppu.co.kr";

const boards: Board[] = [
  { key: "freeboard", name: "자유게시판", url: `${BASE}/zboard/zboard.php?id=freeboard&hotlist_flag=999` },
  { key: "ppomppu", name: "뽐뿌게시판", url: `${BASE}/zboard/zboard.php?id=ppomppu&hotlist_flag=999` },
  { key: "phone", name: "휴대폰포럼", url: `${BASE}/zboard/zboard.php?id=phone` },
  { key: "car", name: "자동차포럼", url: `${BASE}/zboard/zboard.php?id=car` },
  { key: "money", name: "재테크포럼", url: `${BASE}/zboard/zboard.php?id=money` },
];

const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true });

type RssItem = { title?: string; link?: string; author?: string; pubDate?: string; hits?: string };

/** RSS 의 <hits> " [댓글|조회|추천|비추천]" (목록 화면과 대조해 순서 확인) */
function parseHits(hits = "") {
  const [comments = 0, views = 0, likes = 0, dislikes = 0] = hits
    .replace(/[[\]\s]/g, "")
    .split("|")
    .map((n) => Number.parseInt(n, 10) || 0);
  return { comments, views, likes, dislikes };
}

/** 제목에 이중 인코딩으로 남는 HTML 엔티티 정리 */
function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function toPost(item: RssItem): Post | null {
  if (!item.link || !item.title) return null;
  const url = item.link.replace(/^http:\/\//, "https://");
  const id = new URL(url).searchParams.get("no") ?? url;
  const date = item.pubDate ? new Date(item.pubDate) : null;
  return {
    id,
    title: decodeEntities(String(item.title)),
    url,
    author: decodeEntities(String(item.author ?? "")),
    publishedAt: date && !Number.isNaN(date.getTime()) ? date.toISOString() : "",
    ...parseHits(item.hits),
  };
}

async function fetchBoard(board: Board): Promise<Post[]> {
  const res = await fetch(`${BASE}/rss.php?id=${board.key}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/xml" },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`RSS 응답 ${res.status}`);
  const doc = parser.parse(await res.text());
  const raw = doc?.rss?.channel?.item ?? [];
  const items: RssItem[] = Array.isArray(raw) ? raw : [raw];
  return items.map(toPost).filter((p): p is Post => p !== null);
}

export const ppomppu: Source = { id: "ppomppu", name: "뽐뿌", boards, fetchBoard };
