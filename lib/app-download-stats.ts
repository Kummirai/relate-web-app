/**
 * APK download counts from the public GitHub releases that host the Android
 * build. GitHub is where the APK is distributed, so summing the APK asset
 * download counts across releases gives the organisation's app-reach number
 * without adding extra analytics.
 *
 * Cached in-memory for ten minutes: releases change rarely and the public
 * GitHub API is rate limited.
 */
export type AppDownloadStats = {
    downloads: number;
    latestVersion: string | null;
    latestDownloads: number;
    releases: number;
};

const OWNER = "Kummirai";
const REPO = "learnmore";
const CACHE_TTL = 10 * 60 * 1000;

let cache: { data: AppDownloadStats; ts: number } | null = null;

type GitHubAsset = { name?: string; download_count?: number };
type GitHubRelease = {
    tag_name?: string;
    draft?: boolean;
    prerelease?: boolean;
    assets?: GitHubAsset[];
};

function isApk(asset: GitHubAsset): boolean {
    return typeof asset.name === "string" && asset.name.endsWith(".apk");
}

export async function getAppDownloadStats(): Promise<AppDownloadStats | null> {
    if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;

    try {
        const headers: Record<string, string> = {
            Accept: "application/vnd.github+json",
            "User-Agent": "relate-world-backend",
        };
        if (process.env.GITHUB_TOKEN) {
            headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
        }

        const res = await fetch(
            `https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=100`,
            { headers, cache: "no-store", signal: AbortSignal.timeout(5000) },
        );
        if (!res.ok) return cache?.data ?? null;

        const body = await res.json();
        if (!Array.isArray(body)) return cache?.data ?? null;
        const releases = body as GitHubRelease[];

        let downloads = 0;
        let latestVersion: string | null = null;
        let latestDownloads = 0;
        let count = 0;

        for (const release of releases) {
            if (release.draft) continue;
            const apkAssets = (release.assets ?? []).filter(isApk);
            if (apkAssets.length === 0) continue;

            const releaseDownloads = apkAssets.reduce(
                (sum, asset) => sum + (asset.download_count ?? 0),
                0,
            );
            downloads += releaseDownloads;
            count += 1;

            if (latestVersion === null) {
                latestVersion = (release.tag_name ?? "").replace(/^v/i, "") || null;
                latestDownloads = releaseDownloads;
            }
        }

        const data: AppDownloadStats = {
            downloads,
            latestVersion,
            latestDownloads,
            releases: count,
        };
        cache = { data, ts: Date.now() };
        return data;
    } catch {
        return cache?.data ?? null;
    }
}
