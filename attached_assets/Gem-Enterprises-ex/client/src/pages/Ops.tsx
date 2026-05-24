import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export default function Ops() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 space-y-6">
        <div>
          <Badge variant="outline" className="mb-4">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Operations Control Plane
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">System Operations</h1>
          <p className="text-muted-foreground max-w-3xl">
            Internal workspace for asset inventory, platform health, and service maintenance workflows.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">Repository Inventory</h2>
            <p className="text-sm text-muted-foreground mt-2">Review GitHub assets and consolidation candidates.</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">Deployment Inventory</h2>
            <p className="text-sm text-muted-foreground mt-2">Review Vercel project sprawl and production ownership.</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">Safety Gates</h2>
            <p className="text-sm text-muted-foreground mt-2">Sensitive maintenance requires server-side guardrails and confirmation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
