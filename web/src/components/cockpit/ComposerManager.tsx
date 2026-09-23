import { useComposer } from "../../hooks/useComposer"
import { useCatalog } from "../../hooks/useCatalog"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion"
import { ScrollArea } from "../ui/scroll-area"
import { Badge } from "../ui/badge"
import { Switch } from "../ui/switch"
import { Layer1Security } from "../layers/Layer1Security"
import { Layer2RuntimeContract } from "../layers/Layer2RuntimeContract"
import { Layer3Constraints } from "../layers/Layer3Constraints"
import { Layer4Workflow } from "../layers/Layer4Workflow"
import { Layer5DesignSystem } from "../layers/Layer5DesignSystem"
import { Layer6CraftRules } from "../layers/Layer6CraftRules"
import { Layer7SkillTemplate } from "../layers/Layer7SkillTemplate"
import { Layer8UserRules } from "../layers/Layer8UserRules"
import { Layer9BriefClarification } from "../layers/Layer9BriefClarification"
import {
  ShieldCheck,
  Code2,
  Layers,
  GitBranch,
  Palette,
  Sparkles,
  Zap,
  UserCheck,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  FileText,
} from "lucide-react"
import { RoundtripPhaseHeader } from "./RoundtripPhaseHeader"
import { ClarificationZone } from "../clarification/ClarificationZone"
import { cn } from "cn"

export interface ComposerManagerProps {
  readonly className?: string
}

export function ComposerManager({ className }: ComposerManagerProps) {
  const {
    config,
    setConfig,
    updateLayer,
    resetConfig,
    roundtripStep,
    setRoundtripStep,
  } = useComposer()
  const { catalog } = useCatalog()

  // Apply SaaS Starter preset
  const handleApplySaas = () => {
    setConfig((prev) => ({
      ...prev,
      layer3AuthoritativeConstraints: {
        ...prev.layer3AuthoritativeConstraints,
        enabled: true,
        targetFramework: "react",
        cssEngine: "tailwind-v4",
        viewport: "responsive",
      },
      layer4WorkflowManifest: {
        ...prev.layer4WorkflowManifest,
        enabled: true,
        taskKind: "application",
        phase: "draft",
      },
      layer5BrandContract: {
        ...prev.layer5BrandContract,
        enabled: true,
        tokenMode: "condensed",
      },
      layer6CraftRules: {
        ...prev.layer6CraftRules,
        enabled: true,
        selectedRuleIds: ["anti-ai-slop"],
      },
    }))
  }

  // Apply Fintech Dark preset
  const handleApplyFintech = () => {
    setConfig((prev) => ({
      ...prev,
      layer3AuthoritativeConstraints: {
        ...prev.layer3AuthoritativeConstraints,
        enabled: true,
        targetFramework: "react",
        cssEngine: "tailwind-v4",
        viewport: "responsive",
      },
      layer4WorkflowManifest: {
        ...prev.layer4WorkflowManifest,
        enabled: true,
        taskKind: "dashboard",
        phase: "refine",
      },
      layer5BrandContract: {
        ...prev.layer5BrandContract,
        enabled: true,
        tokenMode: "condensed",
      },
      layer6CraftRules: {
        ...prev.layer6CraftRules,
        enabled: true,
        selectedRuleIds: ["anti-ai-slop", "accessibility-contrast"],
      },
    }))
  }

  // Apply Dashboard preset
  const handleApplyDashboard = () => {
    setConfig((prev) => ({
      ...prev,
      layer3AuthoritativeConstraints: {
        ...prev.layer3AuthoritativeConstraints,
        enabled: true,
        targetFramework: "react",
        cssEngine: "tailwind-v4",
        viewport: "responsive",
      },
      layer4WorkflowManifest: {
        ...prev.layer4WorkflowManifest,
        enabled: true,
        taskKind: "dashboard",
        phase: "draft",
      },
      layer6CraftRules: {
        ...prev.layer6CraftRules,
        enabled: true,
        selectedRuleIds: ["anti-ai-slop"],
      },
    }))
  }

  const activeSystem = catalog?.designSystems.find(
    (s) => s.id === config.layer5BrandContract.selectedSystemId
  )
  const activeSystemName = activeSystem
    ? activeSystem.name
    : config.layer5BrandContract.selectedSystemId ?? "None"

  return (
    <section
      data-slot="composer-manager"
      className={cn(
        "flex-1 flex flex-col h-full overflow-hidden bg-background/60 select-none",
        className
      )}
    >
      {/* Top Roundtrip Phase Stepper Header */}
      <RoundtripPhaseHeader />

      {/* Preset Action Bar */}
      <div
        data-slot="preset-action-bar"
        className="flex items-center justify-between p-3.5 border-b border-border/70 bg-card/60 backdrop-blur-sm shrink-0 gap-3"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <SlidersHorizontal className="size-4 text-primary" />
          <span>Presets:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            data-slot="preset-saas"
            onClick={handleApplySaas}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/70 bg-input/20 hover:bg-input/40 text-xs font-medium text-foreground transition-all cursor-pointer hover:border-primary/50"
          >
            <Flame className="size-3 text-orange-400" />
            <span>SaaS Starter</span>
          </button>

          <button
            type="button"
            data-slot="preset-fintech"
            onClick={handleApplyFintech}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/70 bg-input/20 hover:bg-input/40 text-xs font-medium text-foreground transition-all cursor-pointer hover:border-primary/50"
          >
            <Sparkles className="size-3 text-emerald-400" />
            <span>Fintech Dark</span>
          </button>

          <button
            type="button"
            data-slot="preset-dashboard"
            onClick={handleApplyDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/70 bg-input/20 hover:bg-input/40 text-xs font-medium text-foreground transition-all cursor-pointer hover:border-primary/50"
          >
            <Layers className="size-3 text-cyan-400" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            data-slot="preset-reset"
            onClick={resetConfig}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/70 bg-input/20 hover:bg-destructive/15 hover:text-destructive hover:border-destructive/40 text-xs font-medium text-muted-foreground transition-all cursor-pointer"
            title="Reset all layers to default configuration"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Accordion Panels & Clarification Zone (Scrollable with shadcn ScrollArea) */}
      <ScrollArea className="flex-1 min-h-0" viewportClassName="p-4 space-y-4">
        {/* Interactive Clarification Center Panel */}
        <ClarificationZone className="mb-4" />

        <Accordion
          type="multiple"
          defaultValue={["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8", "l9"]}
          className="border-border/70 bg-card/40 rounded-xl divide-y divide-border/60 overflow-hidden"
        >
          {/* L1: Security Guardrails */}
          <AccordionItem value="l1" data-slot="layer-accordion-l1">
            <div className="flex items-center justify-between pr-4 bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="flex-1">
                <AccordionTrigger className="p-3.5 hover:no-underline">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <ShieldCheck className="size-4 text-primary shrink-0" />
                    <span>L1: Security Guardrails</span>
                    <Badge
                      data-slot="layer-badge-l1"
                      variant={config.layer1Security.enabled ? "default" : "outline"}
                      className="ml-1 text-[10px] font-mono capitalize"
                    >
                      {!config.layer1Security.enabled
                        ? "Off"
                        : config.layer1Security.strictMode
                        ? "Strict"
                        : "Active"}
                    </Badge>
                  </div>
                </AccordionTrigger>
              </div>
              <Switch
                data-slot="layer-toggle-l1"
                size="sm"
                checked={config.layer1Security.enabled}
                onCheckedChange={(checked) =>
                  updateLayer("layer1Security", { enabled: checked })
                }
                aria-label="Toggle Layer 1 Security Guardrails"
              />
            </div>
            <AccordionContent className="p-4 bg-background/50 border-t border-border/40">
              <Layer1Security />
            </AccordionContent>
          </AccordionItem>

          {/* L2: Runtime Contract */}
          <AccordionItem value="l2" data-slot="layer-accordion-l2">
            <div className="flex items-center justify-between pr-4 bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="flex-1">
                <AccordionTrigger className="p-3.5 hover:no-underline">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <Code2 className="size-4 text-primary shrink-0" />
                    <span>L2: Runtime Contract</span>
                    <Badge
                      data-slot="layer-badge-l2"
                      variant={config.layer2RuntimeContract.enabled ? "default" : "outline"}
                      className="ml-1 text-[10px] font-mono capitalize"
                    >
                      {!config.layer2RuntimeContract.enabled
                        ? "Off"
                        : config.layer2RuntimeContract.enforceDataOdId
                        ? "data-od-id"
                        : "Active"}
                    </Badge>
                  </div>
                </AccordionTrigger>
              </div>
              <Switch
                data-slot="layer-toggle-l2"
                size="sm"
                checked={config.layer2RuntimeContract.enabled}
                onCheckedChange={(checked) =>
                  updateLayer("layer2RuntimeContract", { enabled: checked })
                }
                aria-label="Toggle Layer 2 Runtime Contract"
              />
            </div>
            <AccordionContent className="p-4 bg-background/50 border-t border-border/40">
              <Layer2RuntimeContract />
            </AccordionContent>
          </AccordionItem>

          {/* L3: Authoritative Technical Constraints */}
          <AccordionItem value="l3" data-slot="layer-accordion-l3">
            <div className="flex items-center justify-between pr-4 bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="flex-1">
                <AccordionTrigger className="p-3.5 hover:no-underline">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <Layers className="size-4 text-primary shrink-0" />
                    <span>L3: Technical Constraints</span>
                    <Badge
                      data-slot="layer-badge-l3"
                      variant={
                        config.layer3AuthoritativeConstraints.enabled
                          ? "default"
                          : "outline"
                      }
                      className="ml-1 text-[10px] font-mono capitalize"
                    >
                      {!config.layer3AuthoritativeConstraints.enabled
                        ? "Off"
                        : `${config.layer3AuthoritativeConstraints.targetFramework} · ${config.layer3AuthoritativeConstraints.cssEngine}`}
                    </Badge>
                  </div>
                </AccordionTrigger>
              </div>
              <Switch
                data-slot="layer-toggle-l3"
                size="sm"
                checked={config.layer3AuthoritativeConstraints.enabled}
                onCheckedChange={(checked) =>
                  updateLayer("layer3AuthoritativeConstraints", { enabled: checked })
                }
                aria-label="Toggle Layer 3 Constraints"
              />
            </div>
            <AccordionContent className="p-4 bg-background/50 border-t border-border/40">
              <Layer3Constraints />
            </AccordionContent>
          </AccordionItem>

          {/* L4: Workflow Manifest */}
          <AccordionItem value="l4" data-slot="layer-accordion-l4">
            <div className="flex items-center justify-between pr-4 bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="flex-1">
                <AccordionTrigger className="p-3.5 hover:no-underline">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <GitBranch className="size-4 text-primary shrink-0" />
                    <span>L4: Workflow Manifest</span>
                    <Badge
                      data-slot="layer-badge-l4"
                      variant={config.layer4WorkflowManifest.enabled ? "default" : "outline"}
                      className="ml-1 text-[10px] font-mono capitalize"
                    >
                      {!config.layer4WorkflowManifest.enabled
                        ? "Off"
                        : `${config.layer4WorkflowManifest.taskKind} · ${config.layer4WorkflowManifest.phase}`}
                    </Badge>
                  </div>
                </AccordionTrigger>
              </div>
              <Switch
                data-slot="layer-toggle-l4"
                size="sm"
                checked={config.layer4WorkflowManifest.enabled}
                onCheckedChange={(checked) =>
                  updateLayer("layer4WorkflowManifest", { enabled: checked })
                }
                aria-label="Toggle Layer 4 Workflow"
              />
            </div>
            <AccordionContent className="p-4 bg-background/50 border-t border-border/40">
              <Layer4Workflow />
            </AccordionContent>
          </AccordionItem>

          {/* L5: Brand Contract (Design System) */}
          <AccordionItem value="l5" data-slot="layer-accordion-l5">
            <div className="flex items-center justify-between pr-4 bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="flex-1">
                <AccordionTrigger className="p-3.5 hover:no-underline">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <Palette className="size-4 text-primary shrink-0" />
                    <span>L5: Brand Contract</span>
                    <Badge
                      data-slot="layer-badge-l5"
                      variant={config.layer5BrandContract.enabled ? "default" : "outline"}
                      className="ml-1 text-[10px] font-mono capitalize"
                    >
                      {!config.layer5BrandContract.enabled
                        ? "Off"
                        : `${config.layer5BrandContract.tokenMode} · ${activeSystemName}`}
                    </Badge>
                  </div>
                </AccordionTrigger>
              </div>
              <Switch
                data-slot="layer-toggle-l5"
                size="sm"
                checked={config.layer5BrandContract.enabled}
                onCheckedChange={(checked) =>
                  updateLayer("layer5BrandContract", { enabled: checked })
                }
                aria-label="Toggle Layer 5 Brand Contract"
              />
            </div>
            <AccordionContent className="p-4 bg-background/50 border-t border-border/40">
              <Layer5DesignSystem />
            </AccordionContent>
          </AccordionItem>

          {/* L6: Craft Discipline & Rules */}
          <AccordionItem value="l6" data-slot="layer-accordion-l6">
            <div className="flex items-center justify-between pr-4 bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="flex-1">
                <AccordionTrigger className="p-3.5 hover:no-underline">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <Sparkles className="size-4 text-primary shrink-0" />
                    <span>L6: Craft Discipline</span>
                    <Badge
                      data-slot="layer-badge-l6"
                      variant={config.layer6CraftRules.enabled ? "default" : "outline"}
                      className="ml-1 text-[10px] font-mono capitalize"
                    >
                      {!config.layer6CraftRules.enabled
                        ? "Off"
                        : `${config.layer6CraftRules.selectedRuleIds.length} rule${
                            config.layer6CraftRules.selectedRuleIds.length === 1 ? "" : "s"
                          }`}
                    </Badge>
                  </div>
                </AccordionTrigger>
              </div>
              <Switch
                data-slot="layer-toggle-l6"
                size="sm"
                checked={config.layer6CraftRules.enabled}
                onCheckedChange={(checked) =>
                  updateLayer("layer6CraftRules", { enabled: checked })
                }
                aria-label="Toggle Layer 6 Craft Discipline"
              />
            </div>
            <AccordionContent className="p-4 bg-background/50 border-t border-border/40">
              <Layer6CraftRules />
            </AccordionContent>
          </AccordionItem>

          {/* L7: Skill & Blueprint */}
          <AccordionItem value="l7" data-slot="layer-accordion-l7">
            <div className="flex items-center justify-between pr-4 bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="flex-1">
                <AccordionTrigger className="p-3.5 hover:no-underline">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <Zap className="size-4 text-primary shrink-0" />
                    <span>L7: Skill &amp; Blueprint</span>
                    <Badge
                      data-slot="layer-badge-l7"
                      variant={config.layer7SkillTemplate.enabled ? "default" : "outline"}
                      className="ml-1 text-[10px] font-mono capitalize"
                    >
                      {!config.layer7SkillTemplate.enabled
                        ? "Off"
                        : config.layer7SkillTemplate.selectedSkillId
                        ? "Skill Active"
                        : "Default"}
                    </Badge>
                  </div>
                </AccordionTrigger>
              </div>
              <Switch
                data-slot="layer-toggle-l7"
                size="sm"
                checked={config.layer7SkillTemplate.enabled}
                onCheckedChange={(checked) =>
                  updateLayer("layer7SkillTemplate", { enabled: checked })
                }
                aria-label="Toggle Layer 7 Skill & Blueprint"
              />
            </div>
            <AccordionContent className="p-4 bg-background/50 border-t border-border/40">
              <Layer7SkillTemplate />
            </AccordionContent>
          </AccordionItem>

          {/* L8: User Memory & Persistent Directives */}
          <AccordionItem value="l8" data-slot="layer-accordion-l8">
            <div className="flex items-center justify-between pr-4 bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="flex-1">
                <AccordionTrigger className="p-3.5 hover:no-underline">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <UserCheck className="size-4 text-primary shrink-0" />
                    <span>L8: User Memory &amp; Rules</span>
                    <Badge
                      data-slot="layer-badge-l8"
                      variant={config.layer8UserMemory.enabled ? "default" : "outline"}
                      className="ml-1 text-[10px] font-mono capitalize"
                    >
                      {!config.layer8UserMemory.enabled
                        ? "Off"
                        : `${
                            config.layer8UserMemory.persistentDirectives.length +
                            config.layer8UserMemory.negativeConstraints.length
                          } rules`}
                    </Badge>
                  </div>
                </AccordionTrigger>
              </div>
              <Switch
                data-slot="layer-toggle-l8"
                size="sm"
                checked={config.layer8UserMemory.enabled}
                onCheckedChange={(checked) =>
                  updateLayer("layer8UserMemory", { enabled: checked })
                }
                aria-label="Toggle Layer 8 User Memory"
              />
            </div>
            <AccordionContent className="p-4 bg-background/50 border-t border-border/40">
              <Layer8UserRules />
            </AccordionContent>
          </AccordionItem>

          {/* L9: Task Brief & Clarification Loop */}
          <AccordionItem value="l9" data-slot="layer-accordion-l9">
            <div className="flex items-center justify-between pr-4 bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="flex-1">
                <AccordionTrigger className="p-3.5 hover:no-underline">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <FileText className="size-4 text-primary shrink-0" />
                    <span>L9: Brief &amp; Clarification</span>
                    <Badge
                      data-slot="layer-badge-l9"
                      variant="default"
                      className="ml-1 text-[10px] font-mono capitalize"
                    >
                      {config.layer9BriefAndClarification.featureRequirements.length > 0 ||
                      config.layer9BriefAndClarification.clarificationAnswers.length > 0
                        ? `${config.layer9BriefAndClarification.featureRequirements.length} reqs · ${config.layer9BriefAndClarification.clarificationAnswers.length} ans`
                        : config.layer9BriefAndClarification.userObjective
                        ? "Active"
                        : "Ready"}
                    </Badge>
                  </div>
                </AccordionTrigger>
              </div>
            </div>
            <AccordionContent className="p-4 bg-background/50 border-t border-border/40">
              <Layer9BriefClarification />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Bottom Turn / Proceed Actions */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            {roundtripStep === "STEP_1_CONFIGURING"
              ? "Review configurations and generate your Turn 1 Discovery Prompt."
              : roundtripStep === "STEP_1_PROMPT_READY"
              ? "Turn 1 prompt ready. Proceed to external AI discovery."
              : "Clarification loop in progress."}
          </div>

          <div className="flex items-center gap-2">
            {roundtripStep === "STEP_1_CONFIGURING" && (
              <button
                type="button"
                data-slot="generate-turn1-prompt-btn"
                onClick={() => setRoundtripStep("STEP_1_PROMPT_READY")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
              >
                <span>Generate Turn 1 Prompt</span>
                <Sparkles className="size-3.5" />
              </button>
            )}

            {roundtripStep === "STEP_1_PROMPT_READY" && (
              <button
                type="button"
                data-slot="proceed-to-clarification-btn"
                onClick={() => setRoundtripStep("AWAITING_AI_RESPONSE")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
              >
                <span>Proceed to Clarification</span>
                <Sparkles className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </ScrollArea>
    </section>
  )
}
