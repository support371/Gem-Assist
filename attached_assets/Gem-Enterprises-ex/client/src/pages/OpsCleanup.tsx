import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck } from "lucide-react";

type RepoItem = {
  fullName: string;
  size: number;
  visibility: string;
  classification: string;
  reason: string;
};

type ProjectItem = {
  id: string;
  name: string;
  classification: string;
  reason: string;
};

type Inventory = {
  mode: string;
  githubRepos: RepoItem[];
  vercelProjects: ProjectItem[];
  issues: string[];
};

export default function OpsCleanup() {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [opsKey, setOpsKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ops-cleanup/inventory", {
        headers: opsKey ? { "x-ops-cleanup-key": opsKey } : {},
      });
      if (!response.ok) throw new Error(await response.text());
      setInventory((await response.json()) as Inventory);
    } catch (err: any) {
      setError(err.message || "Unable to load inventory");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="outline" className="mb-4">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Operations Control Plane
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Repository and Deployment Review</h1>
            <p className="text-muted-foreground max-w-3xl">
              Review GitHub and Vercel assets, see protected items, and prepare a safe cleanup plan.
            </p>
          </div>
          <Button onClick={loadInventory} disabled={busy}>
            <RefreshCw className={`w-4 h-4 mr-2 ${busy ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <label className="block text-sm font-medium">Ops key</label>
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            type="password"
            placeholder="Optional x-ops-cleanup-key"
            value={opsKey}
            onChange={(event) => setOpsKey(event.target.value)}
          />
          <p className="text-sm text-muted-foreground">Mode: {inventory?.mode || "loading"}</p>
        </div>

        {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 whitespace-pre-wrap">{error}</div> : null}

        {inventory?.issues?.length ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Detected setup issues</strong>
            <ul className="list-disc pl-5 mt-2">
              {inventory.issues.map((issue) => <li key={issue}>{issue}</li>)}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border bg-card">
            <div className="border-b p-4 font-semibold">GitHub Repositories</div>
            <div className="divide-y max-h-[620px] overflow-auto">
              {(inventory?.githubRepos || []).map((repo) => (
                <div key={repo.fullName} className="p-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="font-medium">{repo.fullName}</span>
                    <Badge variant="outline">{repo.classification}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{repo.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">{repo.size} KB · {repo.visibility}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border bg-card">
            <div className="border-b p-4 font-semibold">Vercel Projects</div>
            <div className="divide-y max-h-[620px] overflow-auto">
              {(inventory?.vercelProjects || []).length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No Vercel projects loaded. Configure VERCEL_TOKEN and team settings.
                </div>
              ) : null}
              {(inventory?.vercelProjects || []).map((project) => (
                <div key={project.id || project.name} className="p-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="font-medium">{project.name}</span>
                    <Badge variant="outline">{project.classification}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{project.reason}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
