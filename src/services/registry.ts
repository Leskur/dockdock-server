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
  const url = `https://hub.docker.com/v2/search/repositories?query=${encodeURIComponent(
    query.trim()
  )}&page_size=20`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Docker Hub search failed: ${res.status}`);
  }
  const data = (await res.json()) as any;
  return (data.results || [])
    .map((item: any) => {
      const repoName: string = item.repo_name || '';
      const slashIndex = repoName.indexOf('/');
      const namespace = slashIndex >= 0 ? repoName.substring(0, slashIndex) : 'library';
      const repo = slashIndex >= 0 ? repoName.substring(slashIndex + 1) : repoName;
      return {
        name: repoName,
        namespace,
        repo,
        description: item.short_description || '',
        isOfficial: !!item.is_official,
        starCount: item.star_count || 0,
        pullCount: item.pull_count?.toString() || '',
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

export async function listTags(namespace: string, repo: string, name?: string): Promise<TagResult[]> {
  const params = new URLSearchParams();
  params.set('page_size', '50');
  params.set('ordering', 'last_updated');
  if (name && name.trim()) {
    params.set('name', name.trim());
  }
  const url = `https://hub.docker.com/v2/namespaces/${encodeURIComponent(
    namespace
  )}/repositories/${encodeURIComponent(repo)}/tags?${params.toString()}`;
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
