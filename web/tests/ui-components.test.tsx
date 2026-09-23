import React, { act, useState } from "react"
import { createRoot } from "react-dom/client"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

// Import atomic UI components from web/src/components/ui/
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../src/components/ui/accordion"
import { Badge, badgeVariants } from "../src/components/ui/badge"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../src/components/ui/dialog"
import { Input } from "../src/components/ui/input"
import { Textarea } from "../src/components/ui/textarea"
import { Switch } from "../src/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../src/components/ui/tabs"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "../src/components/ui/select"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "../src/components/ui/tooltip"
import { ScrollArea, ScrollBar } from "../src/components/ui/scroll-area"

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe("Atomic UI Components (Task 10)", () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    document.body.innerHTML = ""
  })

  const render = (element: React.ReactElement) => {
    act(() => {
      root.render(element)
    })
    return container
  }

  describe("Badge Component", () => {
    it("renders default badge with text and correct attributes", () => {
      render(<Badge>Default Badge</Badge>)
      const badge = container.querySelector("[data-slot='badge']") as HTMLElement
      expect(badge).toBeTruthy()
      expect(badge.textContent).toBe("Default Badge")
    })

    it("supports various variants (secondary, destructive, outline, ghost)", () => {
      render(
        <div>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="ghost">Ghost</Badge>
        </div>
      )
      const badges = container.querySelectorAll("[data-slot='badge']")
      expect(badges.length).toBe(4)
      expect(badges[0].textContent).toBe("Secondary")
      expect(badges[1].textContent).toBe("Destructive")
      expect(badges[2].textContent).toBe("Outline")
      expect(badges[3].textContent).toBe("Ghost")
    })

    it("applies custom classNames without dropping base styles", () => {
      render(<Badge className="custom-test-class">Custom</Badge>)
      const badge = container.querySelector("[data-slot='badge']") as HTMLElement
      expect(badge.className).toContain("custom-test-class")
    })

    it("exports badgeVariants producing variant utility classes", () => {
      const outlineClasses = badgeVariants({ variant: "outline" })
      expect(outlineClasses).toContain("border-border")
    })
  })

  describe("Input Component", () => {
    it("renders standard input with placeholder and value", () => {
      render(<Input placeholder="Enter prompt..." defaultValue="Hello" />)
      const input = container.querySelector("input") as HTMLInputElement
      expect(input).toBeTruthy()
      expect(input.placeholder).toBe("Enter prompt...")
      expect(input.value).toBe("Hello")
    })

    it("handles onChange events when text is typed", () => {
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} />)
      const input = container.querySelector("input") as HTMLInputElement
      act(() => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set
        nativeInputValueSetter?.call(input, "New input value")
        input.dispatchEvent(new Event("input", { bubbles: true }))
        input.dispatchEvent(new Event("change", { bubbles: true }))
      })
      expect(handleChange).toHaveBeenCalled()
    })

    it("handles disabled state edge case preventing interaction", () => {
      render(<Input disabled placeholder="Disabled input" />)
      const input = container.querySelector("input") as HTMLInputElement
      expect(input.disabled).toBe(true)
      expect(input.getAttribute("disabled")).not.toBeNull()
    })

    it("supports aria-invalid for form error states", () => {
      render(<Input aria-invalid="true" />)
      const input = container.querySelector("input") as HTMLInputElement
      expect(input.getAttribute("aria-invalid")).toBe("true")
    })
  })

  describe("Textarea Component", () => {
    it("renders textarea with rows, placeholder, and defaultValue", () => {
      render(<Textarea placeholder="Detailed brief..." rows={5} defaultValue="Multilined text" />)
      const textarea = container.querySelector("textarea") as HTMLTextAreaElement
      expect(textarea).toBeTruthy()
      expect(textarea.placeholder).toBe("Detailed brief...")
      expect(Number(textarea.rows)).toBe(5)
      expect(textarea.value).toBe("Multilined text")
    })

    it("handles onChange event and disabled state", () => {
      const handleChange = vi.fn()
      render(<Textarea onChange={handleChange} disabled />)
      const textarea = container.querySelector("textarea") as HTMLTextAreaElement
      expect(textarea.disabled).toBe(true)
    })
  })

  describe("Switch Component", () => {
    it("renders switch with role and aria-checked attribute", () => {
      render(<Switch defaultChecked={false} />)
      const switchEl = container.querySelector("[role='switch']") as HTMLElement
      expect(switchEl).toBeTruthy()
      expect(switchEl.getAttribute("aria-checked")).toBe("false")
    })

    it("toggles aria-checked state when clicked in uncontrolled mode", () => {
      render(<Switch defaultChecked={false} />)
      const switchEl = container.querySelector("[role='switch']") as HTMLElement
      act(() => {
        switchEl.click()
      })
      expect(switchEl.getAttribute("aria-checked")).toBe("true")
      act(() => {
        switchEl.click()
      })
      expect(switchEl.getAttribute("aria-checked")).toBe("false")
    })

    it("respects controlled checked value and calls onCheckedChange", () => {
      const handleCheckedChange = vi.fn()
      function ControlledSwitch() {
        const [checked, setChecked] = useState(false)
        return (
          <Switch
            checked={checked}
            onCheckedChange={(val) => {
              setChecked(val)
              handleCheckedChange(val)
            }}
          />
        )
      }
      render(<ControlledSwitch />)
      const switchEl = container.querySelector("[role='switch']") as HTMLElement
      expect(switchEl.getAttribute("aria-checked")).toBe("false")
      act(() => {
        switchEl.click()
      })
      expect(handleCheckedChange).toHaveBeenCalledWith(true)
      expect(switchEl.getAttribute("aria-checked")).toBe("true")
    })

    it("ignores clicks when disabled", () => {
      const handleCheckedChange = vi.fn()
      render(<Switch disabled onCheckedChange={handleCheckedChange} />)
      const switchEl = container.querySelector("[role='switch']") as HTMLElement
      expect(switchEl.getAttribute("aria-disabled")).toBe("true")
      act(() => {
        switchEl.click()
      })
      expect(handleCheckedChange).not.toHaveBeenCalled()
    })
  })

  describe("Tabs Component", () => {
    it("renders tabs list and displays the default active tab content", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Overview</TabsTrigger>
            <TabsTrigger value="tab2">Tokens</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Overview Content</TabsContent>
          <TabsContent value="tab2">Tokens Content</TabsContent>
        </Tabs>
      )
      const triggers = container.querySelectorAll("[role='tab']")
      expect(triggers.length).toBe(2)
      expect(triggers[0].getAttribute("aria-selected")).toBe("true")
      expect(triggers[1].getAttribute("aria-selected")).toBe("false")
      expect(container.textContent).toContain("Overview Content")
    })

    it("switches content when another tab trigger is clicked", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Overview</TabsTrigger>
            <TabsTrigger value="tab2">Tokens</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Overview Content</TabsContent>
          <TabsContent value="tab2">Tokens Content</TabsContent>
        </Tabs>
      )
      const triggers = container.querySelectorAll("[role='tab']")
      act(() => {
        ;(triggers[1] as HTMLElement).click()
      })
      expect(triggers[1].getAttribute("aria-selected")).toBe("true")
      expect(container.textContent).toContain("Tokens Content")
    })

    it("does not activate disabled tabs", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2 Disabled
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )
      const triggers = container.querySelectorAll("[role='tab']")
      act(() => {
        ;(triggers[1] as HTMLElement).click()
      })
      expect(triggers[0].getAttribute("aria-selected")).toBe("true")
      expect(triggers[1].getAttribute("aria-selected")).toBe("false")
    })
  })

  describe("Accordion Component", () => {
    it("renders accordion items and expands on trigger click", () => {
      render(
        <Accordion type="single" defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Layer 1: Security</AccordionTrigger>
            <AccordionContent>Security Constraints Body</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Layer 2: Runtime</AccordionTrigger>
            <AccordionContent>Runtime Contract Body</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const triggers = container.querySelectorAll("[data-slot='accordion-trigger']")
      expect(triggers.length).toBe(2)
      expect(triggers[0].getAttribute("aria-expanded")).toBe("true")
      expect(container.textContent).toContain("Security Constraints Body")

      // Click second trigger to expand item-2
      act(() => {
        ;(triggers[1] as HTMLElement).click()
      })
      expect(triggers[1].getAttribute("aria-expanded")).toBe("true")
      expect(container.textContent).toContain("Runtime Contract Body")
    })

    it("supports multiple open items when type is multiple", () => {
      render(
        <Accordion type="multiple" defaultValue={["item-1"]}>
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const triggers = container.querySelectorAll("[data-slot='accordion-trigger']")
      expect(triggers[0].getAttribute("aria-expanded")).toBe("true")
      expect(triggers[1].getAttribute("aria-expanded")).toBe("false")

      act(() => {
        ;(triggers[1] as HTMLElement).click()
      })
      // Both should be open
      expect(triggers[0].getAttribute("aria-expanded")).toBe("true")
      expect(triggers[1].getAttribute("aria-expanded")).toBe("true")
    })

    it("handles disabled item edge case", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" disabled>
            <AccordionTrigger>Disabled Trigger</AccordionTrigger>
            <AccordionContent>Cannot expand</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const trigger = container.querySelector("[data-slot='accordion-trigger']") as HTMLElement
      expect(trigger.getAttribute("aria-disabled")).toBe("true")
      act(() => {
        trigger.click()
      })
      expect(trigger.getAttribute("aria-expanded")).toBe("false")
    })
  })

  describe("Dialog Component", () => {
    it("renders trigger and opens dialog on click", () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Preset Selector</DialogTitle>
              <DialogDescription>Select your framework and styling preset</DialogDescription>
            </DialogHeader>
            <div>Dialog Main Body</div>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
      const trigger = container.querySelector("[data-slot='dialog-trigger']") as HTMLElement
      expect(trigger).toBeTruthy()
      expect(trigger.textContent).toBe("Open Dialog")

      // Open dialog
      act(() => {
        trigger.click()
      })

      // Dialog content should be in document and open
      const dialog = document.querySelector("[role='dialog']")
      expect(dialog).toBeTruthy()
      expect(dialog?.getAttribute("data-open")).not.toBeNull()
      expect(document.body.textContent).toContain("Preset Selector")
      expect(document.body.textContent).toContain("Select your framework and styling preset")

      // Close dialog via close button
      const closeButton = document.querySelector("[data-slot='dialog-close']") as HTMLElement
      expect(closeButton).toBeTruthy()
      act(() => {
        closeButton.click()
      })
      expect(dialog?.getAttribute("data-closed")).not.toBeNull()
    })
  })

  describe("Select Component", () => {
    it("renders select trigger with placeholder or initial value", () => {
      render(
        <Select defaultValue="react">
          <SelectTrigger>
            <SelectValue placeholder="Select framework" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Frameworks</SelectLabel>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="vue">Vue</SelectItem>
              <SelectItem value="next">Next.js</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )
      const trigger = container.querySelector("[data-slot='select-trigger']") as HTMLElement
      expect(trigger).toBeTruthy()
      expect(trigger.textContent?.toLowerCase()).toContain("react")
    })

    it("opens select popup when trigger is clicked and selects option", () => {
      const handleValueChange = vi.fn()
      render(
        <Select defaultValue="react" onValueChange={handleValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select framework" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="react">React</SelectItem>
            <SelectItem value="vue">Vue</SelectItem>
          </SelectContent>
        </Select>
      )
      const trigger = container.querySelector("[data-slot='select-trigger']") as HTMLElement
      act(() => {
        trigger.click()
      })

      // Items should be rendered in popup
      const items = document.querySelectorAll("[data-slot='select-item']")
      expect(items.length).toBe(2)

      act(() => {
        ;(items[1] as HTMLElement).click()
      })
      expect(handleValueChange).toHaveBeenCalledWith("vue", expect.anything())
    })
  })

  describe("Tooltip Component", () => {
    it("renders tooltip trigger with accessible attributes", () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover me</TooltipTrigger>
            <TooltipContent>Helpful tooltip text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      const trigger = container.querySelector("[data-slot='tooltip-trigger']") as HTMLElement
      expect(trigger).toBeTruthy()
      expect(trigger.textContent).toBe("Hover me")
    })
  })

  describe("ScrollArea Component", () => {
    it("renders scroll-area container and viewport with children", () => {
      render(
        <ScrollArea className="h-64 w-64" viewportClassName="p-4">
          <div data-testid="scroll-content">Scrollable Content</div>
        </ScrollArea>
      )
      const rootEl = container.querySelector("[data-slot='scroll-area']") as HTMLElement
      expect(rootEl).toBeTruthy()
      expect(rootEl.className).toContain("h-64")

      const viewportEl = container.querySelector("[data-slot='scroll-area-viewport']") as HTMLElement
      expect(viewportEl).toBeTruthy()
      expect(viewportEl.className).toContain("p-4")

      const content = container.querySelector("[data-testid='scroll-content']")
      expect(content).toBeTruthy()
      expect(content?.textContent).toBe("Scrollable Content")
    })

    it("renders vertical scrollbar by default", () => {
      render(
        <ScrollArea className="h-64">
          <div>Vertical Content</div>
        </ScrollArea>
      )
      const scrollbars = container.querySelectorAll("[data-slot='scroll-area-scrollbar']")
      expect(scrollbars.length).toBe(1)
      expect(scrollbars[0].getAttribute("data-orientation")).toBe("vertical")

      const thumb = container.querySelector("[data-slot='scroll-area-thumb']")
      expect(thumb).toBeTruthy()
    })

    it("renders both vertical and horizontal scrollbars when orientation is both", () => {
      render(
        <ScrollArea className="h-64 w-64" orientation="both">
          <div style={{ width: "1000px" }}>Wide Content</div>
        </ScrollArea>
      )
      const scrollbars = container.querySelectorAll("[data-slot='scroll-area-scrollbar']")
      expect(scrollbars.length).toBe(2)
      const orientations = Array.from(scrollbars).map((sb) => sb.getAttribute("data-orientation"))
      expect(orientations).toContain("vertical")
      expect(orientations).toContain("horizontal")
    })

    it("renders standalone ScrollBar component with specified orientation", () => {
      render(
        <ScrollArea className="h-64">
          <div>Horizontal Content</div>
          <ScrollBar orientation="horizontal" data-slot="custom-scrollbar" />
        </ScrollArea>
      )
      const scrollbar = container.querySelector("[data-slot='custom-scrollbar']")
      expect(scrollbar).toBeTruthy()
      expect(scrollbar?.getAttribute("data-orientation")).toBe("horizontal")
    })
  })
})
