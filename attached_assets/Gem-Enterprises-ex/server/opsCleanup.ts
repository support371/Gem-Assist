import type { Express, Request, Response } from "express";

type CleanupClassification = "protected" | "delete-candidate" | "archive-review" | "review";

type RepoInventoryItem = {
  name: string;
  fullName: string;
  owner: string;
  size: number;
  visibility: string;
  defaultBranch?: string;
  url?: string;
  archived?: boolean;
  classification: CleanupClassification;
  reason: string;
};

type VercelProjectItem = {
  id: string;
  name: string;
  framework?: string | null;
  updatedAt?: number | null;
  url?: string;
  targets?: string[];
  classification: CleanupClassification;
  reason: string;
};

const GITHUB_OWNER = process.env.GITHUB_OWNER || "support371";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || "";
const VERCEL_TEAM_SLUG = process.env.VERCEL_TEAM_SLUG || "";
const OPS_CLEANUP_KEY = process.env.OPS_CLEANUP_KEY || "";
const ALLOW_DESTRUCTIVE_CLEANUP = process.env.ALLOW_DESTRUCTIVE_CLEANUP === "true";

const PROTECTED_REPOS = new Set([
  "support371/GEM-Cybersecurity-Monitoring-Assist",
  "support371/Gem-Assist",
  "support371/GemAssistLive",
  "support371/GEM-Assist_AI_Autonomous_Agent",
  "support371/crypto-signal-bot",
  "support371/My_Bentley_webpage",
  "support371/ESIM_Managemen",
  "support371/AzureWebsite",
  "support371/azuredev-c96e",
  "support371/nexus-financial-platform",
  "support371/fintech-microservices-core",
  "support371/My-client-portal-",
  "support371/MymainEnterprisewebsite",
  "support371/MymainEmterpriseWebsite",
  "support371/GemAiAgent",
  "support371/.github",
]);

const SEEDED_REPOS: RepoInventoryItem[] = [
  "support371/i",
  "support371/super-duper-space-potato",
  "support371/NewRepo",
  "support371/Gem-Alliance",
  "support371/GEM-HANDBOOK",
  "support371/Gem-News-automation",
  "support371/News-automation",
  "support371/News-Automate",
  "support371/Team-members-board-management",
  "support371/infinite-wealth-wellbeing",
  "support371/my-client-and-admin-portal",
  "support371/v0-gemassisttemplates",
  "support371/v0-gem-assist",
  "support371/v0-gemfeed",
  "support371/v0-website-automation",
  "support371/vite-react",
  "support371/site-unzip-go",
  "support371/remix-of-exact-screenshot",
  "support371/remix-of-crypto-signal-bot",
  "support371/remix-of-gem-trust-engine",
  "support371/remix-of-remix-of-remix-of-remix-of-gem-enterprise-trust",
  "support371/azuredev-70f8",
  "support371/azuredev-5e38",
  "support371/azuredev-b057",
  "support371/azuredev-305e",
  "support371/azuredev-d482",
  "support371/azuredev-c5b2",
  "support371/azuredev-7927",
  "support371/azuredev-80a7",
  "support371/azuredev-798b",
  "support371/azuredev-4bc7",
  "support371/azuredev-f942",
  "support371/azuredev-8317",
  "support371/azuredev-3072",
  "support371/azuredev-668d",
  "support371/azuredev-ca19",
].map((fullName) => {
  const [owner, name] = fullName.split("/");
  return {
    name,
    fullName,
    owner,
    size: 0,
    visibility: "unknown",
    classification: "delete-candidate",
    reason: "Seeded from cleanup inventory as generated, duplicate, empty, or experimental.",
  };
});

function requireOpsKey(req: Request, res: Response): boolean {
  if (!OPS_CLEANUP_KEY) return true;
  const provided = req.header("x-ops-cleanup-key") || "";
  if (provided === OPS_CLEANUP_KEY) return true;
  res.status(401).json({
    error: "Unauthorized cleanup request",
    remediation: "Set the x-ops-cleanup-key header to match OPS_CLEANUP_KEY.",
  });
  return false;
}

function classifyRepo(repo: { full_name: string; name: string; size?: number; archived?: boolean }): Pick<RepoInventoryItem, "classification" | "reason"> {
  if (PROTECTED_REPOS.has(repo.full_name)) {
    return { classification: "protected", reason: "Protected canonical or production repository." };
  }

  const name = repo.name.toLowerCase();
  const size = repo.size ?? 0;

  if (size === 0) {
    return { classification: "delete-candidate", reason: "Zero-size repository; likely empty/generated." };
  }
  if (/^azuredev-[a-z0-9]+$/.test(name) && repo.full_name !== "support371/azuredev-c96e") {
    return { classification: "delete-candidate", reason: "Generated AzureDev duplicate; canonical azuredev-c96e is protected." };
  }
  if (name.startsWith("remix-of-") || name.startsWith("v0-") || name.includes("starter") || name.includes("template")) {
    return { classification: "delete-candidate", reason: "Generated starter/remix/template project." };
  }
  if (["cloudflare-docs", "docs", "autogpt", "openai-agents-python", "twilio-node", "itwinjs-core"].includes(name)) {
    return { classification: "archive-review", reason: "Large upstream fork or docs mirror; archive/delete only after confirming no active dependency." };
  }
  return { classification: "review", reason: "Needs human review before deletion." };
}

function classifyVercelProject(project: { name: string; targets?: unknown }): Pick<VercelProjectItem, "classification" | "reason"> {
  const name = project.name.toLowerCase();
  const protectedNames = [
    "my-bentley-webpage",
    "bentley-showcase",
    "gem-enterprise",
    "gem-assist",
    "gem-assist-enterprise",
    "mainapp",
    "crypto-signal-bot",
    "whimsy-trade-bot",
    "nexus-financial-platform",
  ];
  if (protectedNames.some((protectedName) => name.includes(protectedName))) {
    return { classification: "protected", reason: "Potential production/canonical Vercel project." };
  }
  if (name.includes("starter") || name.includes("template") || name.includes("test") || name.startsWith("v0-") || name.includes("duplicate")) {
    return { classification: "delete-candidate", reason: "Likely generated, test, starter, or duplicate Vercel project." };
  }
  return { classification: "review", reason: "Needs repo/domain/environment review before deletion." };
}

async function githubFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    throw new Error(`GitHub ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function vercelFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      ...(init.headers || {}),
    },
  });

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    throw new Error(`Vercel ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function listGithubRepos(): Promise<{ repos: RepoInventoryItem[]; issues: string[] }> {
  const issues: string[] = [];
  if (!GITHUB_TOKEN) {
    issues.push("GITHUB_TOKEN/GH_TOKEN is not configured; using seeded cleanup candidates only.");
    return { repos: SEEDED_REPOS, issues };
  }

  const repos: RepoInventoryItem[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const data = await githubFetch(`/user/repos?per_page=100&page=${page}&affiliation=owner&sort=updated`);
    if (!Array.isArray(data) || data.length === 0) break;

    for (const repo of data) {
      if (repo.owner?.login !== GITHUB_OWNER) continue;
      const classification = classifyRepo(repo);
      repos.push({
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner?.login || GITHUB_OWNER,
        size: repo.size || 0,
        visibility: repo.visibility || (repo.private ? "private" : "public"),
        defaultBranch: repo.default_branch,
        url: repo.html_url,
        archived: repo.archived,
        ...classification,
      });
    }
  }

  return { repos, issues };
}

async function listVercelProjects(): Promise<{ projects: VercelProjectItem[]; issues: string[] }> {
  const issues: string[] = [];
  if (!VERCEL_TOKEN) {
    issues.push("VERCEL_TOKEN is not configured; live Vercel inventory is unavailable.");
    return { projects: [], issues };
  }

  const query = new URLSearchParams();
  if (VERCEL_TEAM_ID) query.set("teamId", VERCEL_TEAM_ID);
  if (VERCEL_TEAM_SLUG) query.set("slug", VERCEL_TEAM_SLUG);

  const data = await vercelFetch(`/v9/projects${query.toString() ? `?${query.toString()}` : ""}`);
  const rawProjects = Array.isArray(data?.projects) ? data.projects : [];

  const projects: VercelProjectItem[] = rawProjects.map((project: any) => {
    const classification = classifyVercelProject(project);
    return {
      id: project.id,
      name: project.name,
      framework: project.framework,
      updatedAt: project.updatedAt,
      url: project.link?.repo ? `${project.link.org}/${project.link.repo}` : undefined,
      targets: project.targets ? Object.keys(project.targets) : [],
      ...classification,
    };
  });

  return { projects, issues };
}

export function registerOpsCleanupRoutes(app: Express) {
  app.get("/api/ops-cleanup/inventory", async (req, res) => {
    if (!requireOpsKey(req, res)) return;

    try {
      const [github, vercel] = await Promise.allSettled([listGithubRepos(), listVercelProjects()]);
      const issues: string[] = [];

      const githubPayload = github.status === "fulfilled" ? github.value : { repos: SEEDED_REPOS, issues: [`GitHub inventory failed: ${github.reason}`] };
      const vercelPayload = vercel.status === "fulfilled" ? vercel.value : { projects: [], issues: [`Vercel inventory failed: ${vercel.reason}`] };

      issues.push(...githubPayload.issues, ...vercelPayload.issues);

      res.json({
        mode: ALLOW_DESTRUCTIVE_CLEANUP ? "armed" : "safe-dry-run",
        owner: GITHUB_OWNER,
        githubRepos: githubPayload.repos,
        vercelProjects: vercelPayload.projects,
        protectedRepos: Array.from(PROTECTED_REPOS).sort(),
        issues,
        guardrails: {
          requiresConfirmText: "DELETE SELECTED ASSETS",
          requiresAllowDestructiveCleanup: true,
          destructiveEnabled: ALLOW_DESTRUCTIVE_CLEANUP,
          opsKeyRequired: Boolean(OPS_CLEANUP_KEY),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Inventory failed" });
    }
  });

  app.post("/api/ops-cleanup/apply", async (req, res) => {
    if (!requireOpsKey(req, res)) return;

    const githubRepos = Array.isArray(req.body.githubRepos) ? req.body.githubRepos : [];
    const vercelProjects = Array.isArray(req.body.vercelProjects) ? req.body.vercelProjects : [];
    const confirmText = req.body.confirmText || "";
    const requestedDryRun = req.body.dryRun !== false;
    const dryRun = requestedDryRun || !ALLOW_DESTRUCTIVE_CLEANUP;

    if (confirmText !== "DELETE SELECTED ASSETS") {
      return res.status(400).json({
        error: "Confirmation text mismatch.",
        expected: "DELETE SELECTED ASSETS",
      });
    }

    const protectedSelected = githubRepos.filter((fullName: string) => PROTECTED_REPOS.has(fullName));
    if (protectedSelected.length > 0) {
      return res.status(400).json({
        error: "Protected repositories cannot be deleted.",
        protectedSelected,
      });
    }

    if (githubRepos.length + vercelProjects.length > 50) {
      return res.status(400).json({ error: "Batch size limit is 50 assets per run." });
    }

    const results: Array<{ provider: string; target: string; status: string; error?: string }> = [];

    for (const fullName of githubRepos) {
      try {
        if (dryRun) {
          results.push({ provider: "github", target: fullName, status: "dry-run" });
          continue;
        }
        if (!GITHUB_TOKEN) throw new Error("Missing GITHUB_TOKEN/GH_TOKEN");
        await githubFetch(`/repos/${encodeURIComponent(fullName).replace("%2F", "/")}`, { method: "DELETE" });
        results.push({ provider: "github", target: fullName, status: "deleted" });
      } catch (error: any) {
        results.push({ provider: "github", target: fullName, status: "failed", error: error.message });
      }
    }

    for (const project of vercelProjects) {
      const idOrName = typeof project === "string" ? project : project.id || project.name;
      try {
        if (dryRun) {
          results.push({ provider: "vercel", target: idOrName, status: "dry-run" });
          continue;
        }
        if (!VERCEL_TOKEN) throw new Error("Missing VERCEL_TOKEN");
        const query = new URLSearchParams();
        if (VERCEL_TEAM_ID) query.set("teamId", VERCEL_TEAM_ID);
        if (VERCEL_TEAM_SLUG) query.set("slug", VERCEL_TEAM_SLUG);
        await vercelFetch(`/v9/projects/${encodeURIComponent(idOrName)}${query.toString() ? `?${query.toString()}` : ""}`, { method: "DELETE" });
        results.push({ provider: "vercel", target: idOrName, status: "deleted" });
      } catch (error: any) {
        results.push({ provider: "vercel", target: idOrName, status: "failed", error: error.message });
      }
    }

    res.json({
      dryRun,
      destructiveEnabled: ALLOW_DESTRUCTIVE_CLEANUP,
      results,
      message: dryRun
        ? "Dry run completed. Set ALLOW_DESTRUCTIVE_CLEANUP=true and submit dryRun=false to execute deletion."
        : "Deletion run completed. Review per-target results.",
    });
  });
}
