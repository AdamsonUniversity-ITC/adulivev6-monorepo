import { DRS_MERGE_TOKENS } from './-merge-tokens.ts';

export function MergeTokenLegend() {
  return (
    <div className="border-border bg-muted/30 space-y-2 rounded-md border p-3">
      <p className="text-sm font-medium">Merge tokens</p>
      <p className="text-muted-foreground text-xs">
        Type a token into the subject or body exactly as shown. Values are
        filled in when the email is sent.
      </p>
      <ul className="space-y-1.5">
        {DRS_MERGE_TOKENS.map((token) => (
          <li key={token.key} className="text-xs leading-5">
            <code className="bg-background rounded px-1 py-0.5 font-mono text-[11px]">
              {token.token}
            </code>
            <span className="text-muted-foreground"> — {token.purpose}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
