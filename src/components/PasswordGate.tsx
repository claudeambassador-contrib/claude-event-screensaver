import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWebMcpTools } from '@/lib/webmcp'

export function PasswordGate({
  onSubmit,
  busy,
  error,
}: {
  onSubmit: (password: string) => Promise<{ ok: boolean }> | { ok: boolean }
  busy?: boolean
  error?: string | null
}) {
  const [pw, setPw] = useState('')

  useWebMcpTools([
    {
      name: 'unlock-screensaver',
      title: 'Unlock screensaver editor',
      description:
        'Verifies the admin password for this screensaver. On success the edit form is shown.',
      inputSchema: {
        type: 'object',
        properties: {
          password: { type: 'string', description: 'The screensaver admin password' },
        },
        required: ['password'],
      },
      execute: (input: Record<string, unknown>) => {
        const { password } = input as { password: unknown }
        if (typeof password !== 'string' || password.length === 0) {
          return { ok: false, error: 'password must be a non-empty string' }
        }
        return Promise.resolve(onSubmit(password))
      },
    },
  ])
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (pw) onSubmit(pw)
      }}
      className="mx-auto max-w-sm space-y-4 p-8"
    >
      <h1 className="text-xl font-semibold">Enter password</h1>
      <div className="space-y-2">
        <Label htmlFor="pw">Password</Label>
        <Input
          id="pw"
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" disabled={busy || !pw} className="w-full">
        {busy ? 'Checking...' : 'Unlock'}
      </Button>
    </form>
  )
}
