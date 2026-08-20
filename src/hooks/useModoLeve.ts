import { useSyncExternalStore } from "react";

const CHAVE = "argumenta-modo-leve";

let estado = false;
const ouvintes = new Set<() => void>();

function aplicar(valor: boolean) {
  estado = valor;
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("modo-leve", valor);
  }
  ouvintes.forEach((fn) => fn());
}

/** Detecta Chromebooks escolares fracos: pouca RAM, poucos núcleos ou economia de dados. */
function detectar(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const poucaMemoria = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const poucosNucleos = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  const economiaDados = Boolean(nav.connection?.saveData);
  const menosMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const telaPequena = window.screen?.width <= 1366;
  return poucaMemoria || poucosNucleos || economiaDados || menosMovimento || telaPequena;
}

let iniciado = false;
function iniciar() {
  if (iniciado || typeof window === "undefined") return;
  iniciado = true;
  const salvo = window.localStorage.getItem(CHAVE);
  aplicar(salvo === null ? detectar() : salvo === "1");
}

function subscribe(fn: () => void) {
  iniciar();
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export function alternarModoLeve(valor?: boolean) {
  const novo = valor ?? !estado;
  if (typeof window !== "undefined") window.localStorage.setItem(CHAVE, novo ? "1" : "0");
  aplicar(novo);
}

export function useModoLeve() {
  return useSyncExternalStore(
    subscribe,
    () => estado,
    () => false,
  );
}
