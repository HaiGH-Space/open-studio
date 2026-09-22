import { useComposer } from "../../hooks/useComposer"
import { useCatalog } from "../../hooks/useCatalog"
import { Zap, Layout } from "lucide-react"

export function Layer7SkillTemplate() {
  const { config, updateLayer } = useComposer()
  const { catalog } = useCatalog()

  const { selectedSkillId, selectedTemplateId } = config.layer7SkillTemplate

  const skills = catalog?.skills ?? []
  const templates = catalog?.templates ?? []

  const handleSkillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLayer("layer7SkillTemplate", {
      selectedSkillId: e.target.value || undefined,
    })
  }

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLayer("layer7SkillTemplate", {
      selectedTemplateId: e.target.value || undefined,
    })
  }

  return (
    <div data-slot="layer7-skill-template-panel" className="space-y-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Skill Selection */}
        <div className="space-y-1.5">
          <label
            htmlFor="skill-select"
            className="flex items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Zap className="size-3.5 text-primary" />
            <span>Agent Skill Blueprint</span>
          </label>
          <select
            id="skill-select"
            data-slot="l7-skill-select"
            value={selectedSkillId ?? ""}
            onChange={handleSkillChange}
            className="w-full h-8 px-2.5 rounded-lg border border-border/70 bg-input/20 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">None (Standard Prompt)</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </div>

        {/* Template Selection */}
        <div className="space-y-1.5">
          <label
            htmlFor="template-select"
            className="flex items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Layout className="size-3.5 text-primary" />
            <span>Design Template Blueprint</span>
          </label>
          <select
            id="template-select"
            data-slot="l7-template-select"
            value={selectedTemplateId ?? ""}
            onChange={handleTemplateChange}
            className="w-full h-8 px-2.5 rounded-lg border border-border/70 bg-input/20 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">None (No Scaffolding Blueprint)</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
