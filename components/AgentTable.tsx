type AgentRow = {
  date: string;
  agentId: string;
  provider: string;
  model: string;
  workflow: string;
  totalTokens: number;
  totalCostUsd: number;
};

export function AgentTable({ rows }: { rows: AgentRow[] }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="text-lg font-semibold text-slate-100">Per-Agent Usage</h2>
      <p className="mt-1 text-sm text-slate-400">Exact spend breakdown by provider, model, and workflow tag.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Agent</th>
              <th className="px-3 py-2 font-medium">Provider</th>
              <th className="px-3 py-2 font-medium">Model</th>
              <th className="px-3 py-2 font-medium">Workflow</th>
              <th className="px-3 py-2 font-medium">Tokens</th>
              <th className="px-3 py-2 font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.date}-${row.agentId}-${row.workflow}-${index}`} className="border-t border-slate-800 text-slate-200">
                <td className="px-3 py-2">{row.date}</td>
                <td className="px-3 py-2">{row.agentId}</td>
                <td className="px-3 py-2 capitalize">{row.provider}</td>
                <td className="px-3 py-2">{row.model}</td>
                <td className="px-3 py-2">{row.workflow}</td>
                <td className="px-3 py-2">{row.totalTokens.toLocaleString()}</td>
                <td className="px-3 py-2">${row.totalCostUsd.toFixed(2)}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td className="px-3 py-6 text-slate-400" colSpan={7}>
                  No usage records yet. Send usage events to `/api/providers/*` to populate the dashboard.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
