import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, User } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LINK_BASE = "rounded-md px-3 py-2 text-nav-muted transition hover:bg-nav-active hover:text-nav-foreground";
const LINK_ACTIVE = "rounded-md px-3 py-2 bg-nav-active text-nav-foreground";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useSessao();
  const navigate = useNavigate();

  async function sair() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <header className="bg-nav text-nav-foreground">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/inicio" className="text-base font-semibold tracking-tight text-nav-foreground">
            Argumenta
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            <Link to="/inicio" className={LINK_BASE} activeProps={{ className: LINK_ACTIVE }}>
              Início
            </Link>
            <Link to="/aprender" className={LINK_BASE} activeProps={{ className: LINK_ACTIVE }}>
              Aprender a redigir
            </Link>
            <Link to="/redacao" className={LINK_BASE} activeProps={{ className: LINK_ACTIVE }}>
              Produção de redação
            </Link>
            {isAdmin ? (
              <Link to="/admin" className={LINK_BASE} activeProps={{ className: LINK_ACTIVE }}>
                Painel do administrador
              </Link>
            ) : null}
            <Link to="/desempenho" className={LINK_BASE} activeProps={{ className: LINK_ACTIVE }}>
              Meu Desempenho
            </Link>
            <Link to="/historico" className={LINK_BASE} activeProps={{ className: LINK_ACTIVE }}>
              Histórico de Redações
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full bg-nav-active px-2 py-1.5 pr-3 text-nav-foreground transition hover:opacity-90">
                <span className="flex size-7 items-center justify-center rounded-full bg-brand-cyan/20 text-brand-cyan">
                  <User size={16} />
                </span>
                <span className="font-medium">Perfil</span>
                <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                  {user?.email ?? "Conta"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void sair()}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
