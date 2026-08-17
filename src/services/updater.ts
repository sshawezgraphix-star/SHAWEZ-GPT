export const CURRENT_APP_VERSION = "1.0.5";
export const REPO_OWNER = "sshawezgraphix-star";
export const REPO_NAME = "SHAWEZ-GPT";
export const DIRECT_APK_DOWNLOAD_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/raw/main/releases/ShawezGPT.apk`;

export interface AppUpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
  htmlUrl: string;
}

/**
 * Checks GitHub Releases API for the latest available ShawezGPT version.
 */
export async function checkForAppUpdate(): Promise<AppUpdateInfo> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to check updates (HTTP ${res.status})`);
    }

    const data = await res.json();
    const rawTag = data.tag_name || "v1.0.5";
    const latestVersion = rawTag.replace(/^v/i, "");
    const currentClean = CURRENT_APP_VERSION.replace(/^v/i, "");

    // Semantic version comparison
    const hasUpdate = isNewerVersion(latestVersion, currentClean);

    // Find direct APK asset if available, else fallback to raw repo link
    let apkDownloadUrl = DIRECT_APK_DOWNLOAD_URL;
    if (data.assets && Array.isArray(data.assets)) {
      const apkAsset = data.assets.find((a: any) => a.name.endsWith(".apk"));
      if (apkAsset?.browser_download_url) {
        apkDownloadUrl = DIRECT_APK_DOWNLOAD_URL; // Prefer raw fast CDN link
      }
    }

    return {
      hasUpdate,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion,
      releaseName: data.name || `ShawezGPT v${latestVersion}`,
      releaseNotes: data.body || "Performance improvements and bug fixes.",
      publishedAt: data.published_at || new Date().toISOString(),
      downloadUrl: apkDownloadUrl,
      htmlUrl: data.html_url || `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`,
    };
  } catch (err: any) {
    console.warn("[AppUpdater] Update check failed:", err.message);
    return {
      hasUpdate: false,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: CURRENT_APP_VERSION,
      releaseName: `ShawezGPT v${CURRENT_APP_VERSION}`,
      releaseNotes: "You are running the latest installed version.",
      publishedAt: new Date().toISOString(),
      downloadUrl: DIRECT_APK_DOWNLOAD_URL,
      htmlUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`,
    };
  }
}

/**
 * Triggers direct APK download and update installation on mobile or web.
 */
export function triggerAppUpdate(downloadUrl?: string): void {
  const targetUrl = downloadUrl || DIRECT_APK_DOWNLOAD_URL;
  if (typeof window !== "undefined") {
    // Open in browser to trigger native APK download & package installer
    window.open(targetUrl, "_system");
  }
}

/**
 * Compares two version strings (e.g. "1.0.6" > "1.0.5")
 */
function isNewerVersion(latest: string, current: string): boolean {
  const lParts = latest.split(".").map((n) => parseInt(n, 10) || 0);
  const cParts = current.split(".").map((n) => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}
