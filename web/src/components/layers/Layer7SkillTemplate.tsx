import { useMemo } from "react"
import { useComposer } from "../../hooks/useComposer"
import { useCatalog } from "../../hooks/useCatalog"
import { Zap, Layout } from "lucide-react"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

export function Layer7SkillTemplate() {
  const { config, updateLayer } = useComposer()
  const { catalog } = useCatalog()

  const { selectedSkillId, selectedTemplateId } = config.layer7SkillTemplate

  const skills = catalog?.skills
  const templates = catalog?.templates

  const skillItems = useMemo(
    () => [
      { value: "none", label: "None (Standard Prompt)" },
      ...(skills?.map((skill) => ({ value: skill.id, label: skill.name })) ??
        []),
    ],
    [skills]
  )

  const templateItems = useMemo(
    () => [
      { value: "none", label: "None (No Scaffolding Blueprint)" },
      ...(templates?.map((tpl) => ({ value: tpl.id, label: tpl.name })) ?? []),
    ],
    [templates]
  )

  const handleSkillChange = (val: string | null) => {
    updateLayer("layer7SkillTemplate", {
      selectedSkillId: val && val !== "none" ? val : undefined,
    })
  }

  const handleTemplateChange = (val: string | null) => {
    updateLayer("layer7SkillTemplate", {
      selectedTemplateId: val && val !== "none" ? val : undefined,
    })
  }

  return (
    <div data-slot="layer7-skill-template-panel" className="space-y-4 py-2">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Skill Selection */}
        <div className="relative space-y-1.5">
          <Label
            htmlFor="skill-select"
            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Zap className="size-3.5 text-primary" />
            <span>Agent Skill Blueprint</span>
          </Label>
          <select
            id="skill-select-native"
            data-slot="l7-skill-select"
            tabIndex={-1}
            aria-hidden="true"
            value={selectedSkillId ?? ""}
            onChange={(e) => handleSkillChange(e.target.value)}
            className="sr-only"
          >
            <option value="">None (Standard Prompt)</option>
            {skills?.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
          <Select
            items={skillItems}
            value={selectedSkillId ?? "none"}
            onValueChange={handleSkillChange}
          >
            <SelectTrigger
              id="skill-select"
              data-slot="l7-skill-trigger"
              size="sm"
              className="w-full cursor-pointer rounded-lg border-border/70 bg-input/20 text-xs"
            >
              <SelectValue placeholder="Select skill blueprint" />
            </SelectTrigger>
            <SelectContent>
              {skillItems.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="py-1.5 text-xs"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Selection */}
        <div className="relative space-y-1.5">
          <Label
            htmlFor="template-select"
            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Layout className="size-3.5 text-primary" />
            <span>Design Template Blueprint</span>
          </Label>
          <select
            id="template-select-native"
            data-slot="l7-template-select"
            tabIndex={-1}
            aria-hidden="true"
            value={selectedTemplateId ?? ""}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="sr-only"
          >
            <option value="">None (No Scaffolding Blueprint)</option>
            {templates?.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
          <Select
            items={templateItems}
            value={selectedTemplateId ?? "none"}
            onValueChange={handleTemplateChange}
          >
            <SelectTrigger
              id="template-select"
              data-slot="l7-template-trigger"
              size="sm"
              className="w-full cursor-pointer rounded-lg border-border/70 bg-input/20 text-xs"
            >
              <SelectValue placeholder="Select template blueprint" />
            </SelectTrigger>
            <SelectContent>
              {templateItems.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="py-1.5 text-xs"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
