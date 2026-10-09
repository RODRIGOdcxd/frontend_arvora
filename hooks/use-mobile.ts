import * as React from "react"

const MOBILE_BREAKPOINT = 768
const CONSULTA = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function suscribir(alCambiar: () => void) {
  const media = window.matchMedia(CONSULTA)
  media.addEventListener("change", alCambiar)
  return () => media.removeEventListener("change", alCambiar)
}

function esMovil() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useIsMobile() {
  return React.useSyncExternalStore(suscribir, esMovil, () => false)
}
