import type { BoardFeed, Source } from "../types";
import { ppomppu } from "./ppomppu";

/** 새 사이트는 Source 를 구현해 여기에 추가 */
export const sources: Source[] = [ppomppu];

/** 모든 소스의 모든 게시판을 병렬 조회. 한 게시판이 실패해도 나머지는 보여준다. */
export async function fetchAllFeeds(): Promise<BoardFeed[]> {
  const jobs = sources.flatMap((source) =>
    source.boards.map(async (board): Promise<BoardFeed> => {
      const base = { feedId: `${source.id}:${board.key}`, sourceId: source.id, sourceName: source.name, board };
      try {
        return { ...base, posts: await source.fetchBoard(board) };
      } catch (e) {
        return { ...base, posts: [], error: e instanceof Error ? e.message : String(e) };
      }
    }),
  );
  return Promise.all(jobs);
}
