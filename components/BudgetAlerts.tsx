import { AlertTriangle } from 'lucide-react';

import type { RunawayAgent } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function BudgetAlerts({ agents }: { agents: RunawayAgent[] }) {
  return (
    <Card className="border-red-500/40 bg-red-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-300">
          <AlertTriangle className="h-5 w-5" />
          Runaway Spend Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {agents.length === 0 ? (
          <p className="text-sm text-slate-300">No agents are over budget this month.</p>
        ) : (
          agents.map((agent) => (
            <div key={agent.agent} className="flex items-center justify-between rounded-lg border border-red-900/60 bg-slate-950/70 p-3">
              <div>
                <p className="font-medium text-slate-100">{agent.agent}</p>
                <p className="text-sm text-slate-400">
                  Spend ${agent.spend.toFixed(2)} vs budget ${agent.budget.toFixed(2)}
                </p>
              </div>
              <Badge variant="destructive">+${agent.overBy.toFixed(2)}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
