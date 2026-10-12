import FeedView from "@/components/FeedView";
import { fetchAllFeeds } from "@/lib/sources";

// 10분마다 다시 생성 (REVALIDATE_SECONDS 와 같은 값 — Next 가 정적 분석하므로 리터럴로 둔다)
export const revalidate = 600;

export default async function Home() {
  const feeds = await fetchAllFeeds();
  return <FeedView feeds={feeds} fetchedAt={new Date().toISOString()} />;
}
