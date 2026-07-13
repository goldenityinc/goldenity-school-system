"use client";

import { createContext, useContext, useMemo, useState } from "react";

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

const tenantOptions: TenantOption[] = [
  { label: "SD Goldenity", value: "tenant-sd-01" },
  { label: "SMP Goldenity", value: "tenant-smp-02" }
];

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [selectedTenant, setSelectedTenant] = useState("tenant-sd-01");

  const value = useMemo(() => {
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
