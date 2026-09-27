import { useComposer } from "../../hooks/useComposer"
import { Switch } from "../ui/switch"
import { ShieldCheck, Lock } from "lucide-react"

export function Layer1Security() {
  const { config } = useComposer()
  const { strictMode } = config.layer1Security

  return (
    <div data-slot="layer1-security-panel" className="space-y-4 py-2">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Lock className="size-4 text-primary" />
            <span>Strict Security Mode</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Disallows arbitrary script injections, unsanitized HTML eval blocks,
            and framework escaping techniques in generated prompts.
          </p>
        </div>
        <Switch
          data-slot="l1-strict-mode-toggle"
          checked={strictMode}
          disabled={true}
          aria-disabled="true"
          aria-label="Strict security mode is permanently enabled"
          title="Strict Security Mode is permanently enabled"
        />
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-primary" />
        <span>
          Encapsulates system rules in strict{" "}
          <code className="font-mono text-[11px] text-primary">
            &lt;security-guardrails&gt;
          </code>{" "}
          tags.
        </span>
      </div>
    </div>
  )
}
