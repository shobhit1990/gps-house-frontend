import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type SelectDropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

/** Unique option identity — value alone is not unique when duplicates share a value. */
const optionIdentity = (opt: SelectDropdownOption) =>
  `${String(opt.value)}__${opt.label}`;

/** Searchable menus focus the input; plain lists keep Radix's default list focus. */
function handlePopoverOpenAutoFocus(
  event: Event,
  searchable: boolean,
  searchInput: HTMLInputElement | null,
) {
  if (!searchable) return;
  event.preventDefault();
  searchInput?.focus();
}

type SelectDropdownProps = {
  id?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectDropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  emptyText?: string;
  maxListHeightClassName?: string;
  /** When true, shows a search input and filters options by label. */
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function SelectDropdown({
  id,
  value = "",
  onValueChange,
  options,
  placeholder = "Select",
  disabled,
  className,
  emptyText = "No options found.",
  maxListHeightClassName = "max-h-[220px]",
  searchable = false,
  searchPlaceholder = "Search...",
}: SelectDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const selectedByIdentity = options.find(
    (o) => optionIdentity(o) === String(value)
  );
  const valueMatches = options.filter((o) => String(o.value) === String(value));
  // Plain value match only when unique (legacy controlled values / unique options)
  const selectedOption =
    selectedByIdentity ??
    (valueMatches.length === 1 ? valueMatches[0] : undefined);

  const selectedLabel = selectedOption?.label ?? "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal text-left",
            disabled && "disabled:opacity-50",
            className
          )}
        >
          <span className="truncate" title={selectedLabel || undefined}>
            {selectedLabel ? selectedLabel : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[80] w-[var(--radix-popover-trigger-width)] min-w-[12rem] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(event) =>
          handlePopoverOpenAutoFocus(event, searchable, searchInputRef.current)
        }
      >
        <Command
          shouldFilter={searchable}
          className="h-auto overflow-hidden"
          filter={
            searchable
              ? (itemValue, search) => {
                  const q = search.trim().toLowerCase();
                  if (!q) return 1;
                  return itemValue.toLowerCase().includes(q) ? 1 : 0;
                }
              : undefined
          }
        >
          {searchable ? (
            <CommandInput ref={searchInputRef} placeholder={searchPlaceholder} />
          ) : null}
          <CommandList
            className={cn(
              maxListHeightClassName,
              "overflow-y-auto overscroll-contain dropdown-scroll",
            )}
          >
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt, index) => {
                const identity = optionIdentity(opt);
                const valueDuplicated =
                  options.filter((o) => String(o.value) === String(opt.value))
                    .length > 1;
                const isSelected =
                  String(value) === String(opt.value) ||
                  String(value) === identity ||
                  (!valueDuplicated &&
                    selectedOption != null &&
                    optionIdentity(selectedOption) === identity);

                return (
                  <CommandItem
                    key={`${identity}__${index}`}
                    // Include label so searchable mode filters by display name.
                    value={searchable ? `${opt.label} ${identity}` : identity}
                    disabled={opt.disabled}
                    onSelect={() => {
                      if (opt.disabled) return;
                      // Duplicates need identity; unique values keep emitting opt.value
                      onValueChange?.(valueDuplicated ? identity : String(opt.value));
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="min-w-0 flex-1 break-words">{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type MultiSelectDropdownProps = {
  id?: string;
  values?: string[];
  onValuesChange?: (values: string[]) => void;
  options: SelectDropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  emptyText?: string;
  maxListHeightClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
};

/** Checkbox-style dropdown that keeps the menu open so several options can be chosen. */
export function MultiSelectDropdown({
  id,
  values = [],
  onValuesChange,
  options,
  placeholder = "Select",
  disabled,
  className,
  emptyText = "No options found.",
  maxListHeightClassName = "max-h-[220px]",
  searchable = false,
  searchPlaceholder = "Search...",
}: MultiSelectDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const selected = new Set(values.map((v) => String(v)));
  const labelByValue = new Map(
    options.map((opt) => [String(opt.value), opt.label] as const)
  );
  const selectedItems = values
    .map((value) => String(value))
    .filter((value) => value && selected.has(value))
    .map((value) => ({
      value,
      label: labelByValue.get(value) ?? value,
    }));

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onValuesChange?.(Array.from(next));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal text-left",
            disabled && "disabled:opacity-50",
            className,
            "!h-auto !min-h-10 !items-start !whitespace-normal !py-2"
          )}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-left">
            {selectedItems.length === 0 ? (
              <span className="text-slate-500">{placeholder}</span>
            ) : (
              selectedItems.map((item) => (
                <span
                  key={item.value}
                  className="inline-flex max-w-full items-center break-words rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium leading-5 text-slate-800"
                >
                  {item.label}
                </span>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 mt-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[80] w-[var(--radix-popover-trigger-width)] min-w-[12rem] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(event) =>
          handlePopoverOpenAutoFocus(event, searchable, searchInputRef.current)
        }
      >
        <Command
          shouldFilter={searchable}
          className="h-auto overflow-hidden"
          filter={
            searchable
              ? (itemValue, search) => {
                  const q = search.trim().toLowerCase();
                  if (!q) return 1;
                  return itemValue.toLowerCase().includes(q) ? 1 : 0;
                }
              : undefined
          }
        >
          {searchable ? (
            <CommandInput ref={searchInputRef} placeholder={searchPlaceholder} />
          ) : null}
          <CommandList
            className={cn(
              maxListHeightClassName,
              "overflow-y-auto overscroll-contain dropdown-scroll",
            )}
          >
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt, index) => {
                const value = String(opt.value);
                const isSelected = selected.has(value);
                return (
                  <CommandItem
                    key={`${value}__${index}`}
                    value={searchable ? `${opt.label} ${value}` : value}
                    disabled={opt.disabled}
                    onSelect={() => {
                      if (opt.disabled) return;
                      toggle(value);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="min-w-0 flex-1 break-words">{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

