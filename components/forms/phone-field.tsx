"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

type Country = {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
};

type PhoneFieldProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
};

function flagImageUrl(countryCode: string) {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}

function FlagImage({ code, className = "h-3.5 w-5" }: { code: string; className?: string }) {
  return <img src={flagImageUrl(code)} alt="" className={`${className} rounded-[2px] object-cover shadow-sm`} loading="lazy" />;
}

export function PhoneField({ value = "", onChange, onBlur, error }: PhoneFieldProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryCode, setCountryCode] = useState("PH");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/countries")
      .then((response) => response.json())
      .then((data: Country[]) => {
        if (!mounted) return;
        setCountries(data);
      })
      .catch(() => {
        if (!mounted) return;
        setCountries([{ code: "PH", name: "Philippines", dialCode: "+63", flag: "PH" }]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selected = useMemo(
    () => countries.find((country) => country.code === countryCode) ?? countries[0],
    [countries, countryCode],
  );

  useEffect(() => {
    if (!selected || value.trim()) return;
    onChange(selected.dialCode);
  }, [onChange, selected, value]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const localNumber = selected && value.trim().startsWith(selected.dialCode)
    ? value.trim().slice(selected.dialCode.length).trimStart()
    : value.trim();

  function handleCountryChange(nextCode: string) {
    const next = countries.find((country) => country.code === nextCode);
    if (!next) return;
    const previousDial = selected?.dialCode;
    const trimmed = value.trim();
    setCountryCode(nextCode);
    setOpen(false);
    const local = previousDial && trimmed.startsWith(previousDial) ? trimmed.replace(previousDial, "").trim() : trimmed;
    onChange(`${next.dialCode}${local ? ` ${local}` : ""}`);
  }

  function handleLocalNumberChange(nextValue: string) {
    if (!selected) {
      onChange(nextValue);
      return;
    }
    onChange(`${selected.dialCode}${nextValue ? ` ${nextValue}` : ""}`);
  }

  return (
    <div ref={rootRef}>
      <div className="mt-2 grid grid-cols-[96px_1fr] gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={`flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-border"}`}
            aria-label="Country code"
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              {selected ? <FlagImage code={selected.flag} /> : null}
              <span>{selected?.dialCode ?? "Code"}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted" />
          </button>
          {open ? (
            <div className="absolute left-0 top-11 z-30 max-h-72 w-64 overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountryChange(country.code)}
                  className={`flex h-9 w-full items-center gap-2 px-3 text-left text-sm hover:bg-blue-50 ${country.code === countryCode ? "bg-primary text-white hover:bg-primary" : ""}`}
                >
                  <FlagImage code={country.flag} />
                  <span className="min-w-0 flex-1 truncate">{country.name}</span>
                  <span className="shrink-0">{country.dialCode}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <Input
          value={localNumber}
          onChange={(event) => handleLocalNumberChange(event.target.value)}
          onBlur={onBlur}
          className={error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}
          placeholder="917 123 4567"
          type="tel"
          inputMode="tel"
        />
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
