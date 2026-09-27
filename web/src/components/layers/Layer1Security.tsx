import { useComposer } from "../../hooks/useComposer"
import { Switch } from "../ui/switch"
import { ShieldCheck, Lock } from "lucide-react"

export function Layer1Security() {
  const { config } = useComposer()
  const { strictMode } = config.layer1Security

  return (
    <div data-slot="layer1-security-panel" className="space-y-2.5 py-1">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Lock className="size-3.5 text-primary" />
            <span>Strict Security Mode</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Disallows arbitrary script injections, unsanitized HTML eval blocks,
            and framework escaping techniques in generated prompts.
          </p>
        </div>
        <Switch
          data-slot="l1-strict-mode-toggle"
          size="sm"
          checked={strictMode}
          disabled={true}
          aria-disabled="true"
          aria-label="Strict security mode is permanently enabled"
          title="Strict Security Mode is permanently enabled"
        />
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0 text-primary" />
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
