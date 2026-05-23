"use client";

import { Select } from "@/components/ui/input";
import { useSalesReps } from "@/hooks/use-crm";
import { cn } from "@/lib/utils";

type AssignedUserSelectProps = {
  value?: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  error?: string;
};

export function AssignedUserSelect({ value, onChange, onBlur, error }: AssignedUserSelectProps) {
  const { data: reps, isLoading } = useSalesReps();

  return (
    <Select
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value || null)}
      onBlur={onBlur}
      disabled={isLoading || !reps?.length}
      className={cn("mt-2", error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "")}
    >
      <option value="" disabled>
        {isLoading ? "Loading representatives..." : reps?.length ? "Select sales representative" : "No available representative"}
      </option>
      {(reps ?? []).map((rep) => (
        <option key={rep.id} value={rep.id}>
          {rep.full_name}
        </option>
      ))}
    </Select>
  );
}
