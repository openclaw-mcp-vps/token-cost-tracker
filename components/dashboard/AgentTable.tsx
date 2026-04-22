"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatInt, toCurrency } from "@/lib/utils";

interface AgentRow {
  agent: string;
  workflow: string;
  provider: string;
  model: string;
  costUsd: number;
  totalTokens: number;
  requests: number;
}

interface AgentTableProps {
  rows: AgentRow[];
  budgetLimitUsd: number;
}

export function AgentTable({ rows, budgetLimitUsd }: AgentTableProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-Agent Cost Breakdown</CardTitle>
        <CardDescription>
          Pinpoint which workflows are efficient and which ones are silently draining budget.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Provider / Model</TableHead>
              <TableHead className="text-right">Requests</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isRunaway = row.costUsd > budgetLimitUsd;

              return (
                <TableRow key={`${row.agent}-${row.workflow}-${row.provider}-${row.model}`}>
                  <TableCell className="font-medium text-slate-100">{row.agent}</TableCell>
                  <TableCell>{row.workflow}</TableCell>
                  <TableCell>
                    <div className="text-slate-100">{row.provider}</div>
                    <div className="text-xs text-slate-400">{row.model}</div>
                  </TableCell>
                  <TableCell className="text-right">{formatInt(row.requests)}</TableCell>
                  <TableCell className="text-right">{formatInt(row.totalTokens)}</TableCell>
                  <TableCell className="text-right font-semibold">{toCurrency(row.costUsd)}</TableCell>
                  <TableCell>
                    {isRunaway ? (
                      <Badge variant="danger">Runaway</Badge>
                    ) : (
                      <Badge variant="success">Healthy</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
