"use client";

import { Select } from "@/components/ui/input";
import { useCompanies } from "@/hooks/use-crm";
import { cn } from "@/lib/utils";

type CompanySelectProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
};

export function CompanySelect({ value, onChange, onBlur, error }: CompanySelectProps) {
  const { data: companies, isLoading } = useCompanies();
  const hasCompanies = Boolean(companies?.length);

  return (
    <div className="mt-2">
      <Select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        disabled={isLoading || !hasCompanies}
        className={cn(error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "")}
      >
        <option value="" disabled>
          {isLoading ? "Loading companies..." : hasCompanies ? "Select company" : "Create a company first"}
        </option>
        {(companies ?? []).map((company) => (
          <option key={company.id} value={company.name}>
            {company.name}
          </option>
        ))}
      </Select>
      {!isLoading && !hasCompanies ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          Add the company before creating this record.
        </p>
      ) : null}
    </div>
  );
}
