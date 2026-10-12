/** 게시글 한 건 — 모든 소스(사이트)가 이 형태로 변환해 돌려준다. */
export type Post = {
  id: string;
  title: string;
  url: string;
  author: string;
  /** ISO 8601 (UTC) */
  publishedAt: string;
  comments: number;
  views: number;
  likes: number;
  dislikes: number;
};

export type Board = {
  /** 소스 안에서 유일한 키 (예: ppomppu 의 id 파라미터) */
  key: string;
  name: string;
  /** 사람이 보는 원본 게시판 주소 */
  url: string;
};

/** 사이트 하나 = 소스 하나. 다른 사이트를 추가할 때 이 인터페이스만 구현하면 된다. */
export interface Source {
  id: string;
  name: string;
  boards: Board[];
  fetchBoard(board: Board): Promise<Post[]>;
}

export type BoardFeed = {
  /** `${sourceId}:${board.key}` */
  feedId: string;
  sourceId: string;
  sourceName: string;
  board: Board;
  posts: Post[];
  error?: string;
};
