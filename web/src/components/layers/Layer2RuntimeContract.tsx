import { useComposer } from "../../hooks/useComposer"
import { Switch } from "../ui/switch"
import { Code2, HelpCircle } from "lucide-react"

export function Layer2RuntimeContract() {
  const { config } = useComposer()
  const { enforceDataOdId, injectQuestionProtocol } =
    config.layer2RuntimeContract

  return (
    <div data-slot="layer2-runtime-contract-panel" className="space-y-3 py-2">
      {/* Enforce data-od-id */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Code2 className="size-4 text-primary" />
            <span>
              Enforce DOM Inspection Tags (
              <code className="font-mono text-xs text-primary">data-od-id</code>
              )
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Instructs the agent to attach deterministic{" "}
            <code className="font-mono text-[11px]">data-od-id</code> attributes
            to all key interactive elements for browser inspection and test
            automation.
          </p>
        </div>
        <Switch
          data-slot="l2-enforce-data-od-id-toggle"
          checked={enforceDataOdId}
          disabled={true}
          aria-disabled="true"
          aria-label="Enforce DOM inspection tags is permanently enabled"
          title="DOM Inspection Tags (data-od-id) are permanently enforced"
        />
      </div>

      {/* Inject Question Protocol */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <HelpCircle className="size-4 text-primary" />
            <span>
              Clarification Protocol (
              <code className="font-mono text-xs text-primary">
                &lt;question-form&gt;
              </code>
              )
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Requires the model to respond with structured XML question forms
            when design ambiguities arise, activating Open Studio&apos;s
            interactive answering loop.
          </p>
        </div>
        <Switch
          data-slot="l2-inject-question-protocol-toggle"
          checked={injectQuestionProtocol}
          disabled={true}
          aria-disabled="true"
          aria-label="Clarification question form protocol is permanently enabled"
          title="Clarification Protocol is permanently enabled"
        />
      </div>
    </div>
  )
}
