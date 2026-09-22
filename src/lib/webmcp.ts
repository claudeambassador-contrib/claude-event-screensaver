import { useEffect, useRef } from 'react'
import { z } from 'zod'
import { configInputSchema } from './schema'

// The tool input schemas are derived from the same zod schema the server
// functions and REST API validate against, so they can't drift apart.
// Field descriptions are merged in afterwards to guide agents picking values.
const fieldDescriptions: Record<string, string> = {
  subtitle: 'Text shown under the big pixel CLAUDE title',
  event_date: 'Event date as YYYY-MM-DD, or "" for no date',
  venue: 'Where the event is held',
  wifi: 'WiFi network and password, shown to attendees',
  verbs: 'Rotating "thinking..." phrases, each ending in "..."',
  go_home_messages: 'Wind-down lines shown during the final urgency phase',
  urgency_start_minutes_before_end:
    'Minutes before the last agenda item when the urgency ramp starts (0-240)',
  max_crabs: 'Number of scuttling crab mascots (0-50)',
  mode: '"classic" for floating Clawds, "pacman" for the token-muncher maze',
  pacman_ghosts: 'Ghosts chasing Claude in pacman mode (0-4)',
}

const configJsonSchema = z.toJSONSchema(configInputSchema) as {
  properties?: Record<string, object>
}

const configProperties = Object.fromEntries(
  Object.entries(configJsonSchema.properties ?? {}).map(([key, schema]) => [
    key,
    fieldDescriptions[key] ? { ...schema, description: fieldDescriptions[key] } : schema,
  ]),
)

export const configToolSchema: object = { ...configJsonSchema, properties: configProperties }

export const fillScreensaverFormInputSchema: object = {
  type: 'object',
  properties: { config: configToolSchema },
  required: ['config'],
}

export const createScreensaverInputSchema: object = {
  type: 'object',
  properties: {
    config: configToolSchema,
    password: {
      type: 'string',
      description: 'Admin password for the new screensaver (min 4 characters)',
    },
  },
  required: ['config', 'password'],
}

/**
 * Registers tools with `document.modelContext` (WebMCP) if the browser
 * supports it, and unregisters them when the component unmounts. Tools
 * registered here follow the route component lifecycle, so navigating
 * away cleans them up automatically.
 */
export function useWebMcpTools(tools: WebMCP.ModelContextTool[]) {
  // Dispatch through a ref so a tool's execute always sees the latest
  // props/state, even though registration happened on the first render.
  const toolsRef = useRef(tools)
  toolsRef.current = tools

  useEffect(() => {
    const mc = document.modelContext
    if (!mc) return
    const controller = new AbortController()
    for (const tool of toolsRef.current) {
      void mc
        .registerTool(
          {
            ...tool,
            execute: (input, options) => {
              const latest = toolsRef.current.find((t) => t.name === tool.name)
              return latest ? latest.execute(input, options) : undefined
            },
          },
          { signal: controller.signal },
        )
        .catch((err: unknown) => {
          console.debug(`WebMCP: registering "${tool.name}" failed`, err)
        })
    }
    return () => controller.abort()
  }, [])
}

export function formatParseIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
}