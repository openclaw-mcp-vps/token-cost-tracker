import type { AgentRow } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AgentTable({ rows }: { rows: AgentRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Monthly Spend</TableHead>
          <TableHead>30d Cost</TableHead>
          <TableHead>Tokens</TableHead>
          <TableHead>Providers</TableHead>
          <TableHead>Top Model</TableHead>
          <TableHead>Workflow Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const overBudget = row.monthlyBudgetUsd !== null && row.monthlySpendUsd > row.monthlyBudgetUsd;
          return (
            <TableRow key={row.agent}>
              <TableCell className="font-medium">{row.agent}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>${row.monthlySpendUsd.toFixed(2)}</span>
                  {row.monthlyBudgetUsd !== null ? (
                    <Badge variant={overBudget ? 'destructive' : 'secondary'}>
                      Budget ${row.monthlyBudgetUsd.toFixed(0)}
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>${row.cost.toFixed(2)}</TableCell>
              <TableCell>{row.tokens.toLocaleString()}</TableCell>
              <TableCell>{row.providers.join(', ')}</TableCell>
              <TableCell>{row.models[0] ?? 'n/a'}</TableCell>
              <TableCell>{row.workflows.length}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
