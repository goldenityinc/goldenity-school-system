"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type TenantOption = {
  label: string;
  value: string;
};

type TenantContextValue = {
  selectedTenant: string;
  setSelectedTenant: (tenantId: string) => void;
  tenantOptions: TenantOption[];
  activeTenantLabel: string;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  children,
  initialTenantId
}: {
  children: React.ReactNode;
  initialTenantId?: string | null;
}) {
  const [selectedTenant, setSelectedTenant] = useState(initialTenantId ?? "");

  useEffect(() => {
    if (selectedTenant) {
      return;
    }

    let isActive = true;

    async function hydrateTenantFromSession() {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store"
      });

      if (!isActive || !response.ok) {
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { authenticated?: boolean; session?: { tenantId?: string | null } }
        | null;

      const tenantId = payload?.authenticated ? payload.session?.tenantId : null;

      if (tenantId) {
        setSelectedTenant(tenantId);
      }
    }

    void hydrateTenantFromSession();

    return () => {
      isActive = false;
    };
  }, [selectedTenant]);

  const value = useMemo(() => {
    const tenantOptions: TenantOption[] = selectedTenant
      ? [
          {
            label: "Tenant Aktif",
            value: selectedTenant
          }
        ]
      : [];

    const activeTenantLabel = tenantOptions.find((tenant) => tenant.value === selectedTenant)?.label ?? "Tenant";

    return {
      selectedTenant,
      setSelectedTenant,
      tenantOptions,
      activeTenantLabel
    };
  }, [selectedTenant]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }

  return context;
}
