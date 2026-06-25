export interface SearchResult {
  name: string;
  namespace: string;
  repo: string;
  description: string;
  isOfficial: boolean;
  starCount: number;
  pullCount: string;
}

export async function searchImages(query: string): Promise<SearchResult[]> {
  if (!query || !query.trim()) {
    return [];
  }
  const url = `https://hub.docker.com/api/search/v3/catalog/search?query=${encodeURIComponent(
    query.trim()
  )}&page_size=20`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Docker Hub search failed: ${res.status}`);
  }
  const data = (await res.json()) as any;
  return (data.results || [])
    .filter((item: any) => item.content_types && item.content_types.includes('image'))
    .map((item: any) => {
      const plan = item.rate_plans?.[0];
      const repository = plan?.repositories?.[0];
      return {
        name: item.name,
        namespace: repository?.namespace || '',
        repo: repository?.name || '',
        description: item.short_description || repository?.description || '',
        isOfficial: !!repository?.is_official,
        starCount: item.star_count || 0,
        pullCount: repository?.pull_count || '',
      };
    })
    .filter((item: SearchResult) => item.namespace && item.repo)
    .sort((a: SearchResult, b: SearchResult) => {
      if (a.isOfficial && !b.isOfficial) return -1;
      if (!a.isOfficial && b.isOfficial) return 1;
      return b.starCount - a.starCount;
    });
}

export interface TagResult {
  name: string;
  lastUpdated: string;
  size?: number;
}

export async function listTags(namespace: string, repo: string): Promise<TagResult[]> {
  const url = `https://hub.docker.com/v2/repositories/${encodeURIComponent(
    namespace
  )}/${encodeURIComponent(repo)}/tags/?page_size=50&ordering=last_updated`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Docker Hub tags failed: ${res.status}`);
  }
  const data = (await res.json()) as any;
  return (data.results || []).map((item: any) => {
    const image =
      (item.images || []).find((img: any) => img.size) || item.images?.[0];
    return {
      name: item.name,
      lastUpdated: item.last_updated || '',
      size: image?.size,
    };
  });
}
