"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setAccessToken } from "@/lib/api/client"

/**
 * El login real será POST /api/v1/auth/login cuando exista Spring Security.
 * `setAccessToken` deja el Bearer listo para el interceptor del cliente.
 */
export function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  return (
    <main className="page-enter flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Image src="/images/logoArvora.jpg" alt="ARVORA & METAL" width={72} height={72} className="rounded-lg" />
          <CardTitle>ARVORA & METAL</CardTitle>
          <CardDescription>
            El inicio de sesión todavía no está en el API. Esta pantalla queda lista para recibir el token JWT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              setAccessToken(null)
              toast.message("Aún no hay autenticación", {
                description: `Cuando el backend exponga el login, ${email || "el correo"} y la contraseña pedirán el token. Hoy puede entrar sin sesión.`,
              })
              void password
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="lucia.ventas@arvora.pe" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <Button type="submit" variant="outline">
              Probar acceso
            </Button>
            <Button type="button" onClick={() => router.push("/")}>
              Entrar al panel sin sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
