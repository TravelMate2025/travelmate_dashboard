import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  selectedOption: string;
  setSelectedOption: (value: string) => void;
  options: FilterOption[];
}

export const FilterDropdown = ({
  selectedOption,
  setSelectedOption,
  options,
}: FilterDropdownProps) => {
  

  const [label, setLabel] = useState("");

  const handleSelect = (option: FilterOption) => {
    setSelectedOption(option.value);
    setLabel(option.label);
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild >
          <div className="flex items-center justify-between cursor-pointer lg:py-4 py-[10px] px-[12px] lg:px-6 shadow-sm bg-[#fff] rounded-[1000px] w-[170px]">
            <p className="text-[12px] lg:text-[14px] leading-[18px] lg:leading-[100%] lg:text-base font-[400] text-[#181818]">
              {label || "Filter by Status"}
            </p>
            <img
              src="/assets/icons/chevron-down.svg"
              alt="Dropdown Icon"
              className="w-5 rotate-90"
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-full mt-1 border border-gray-300 rounded-lg bg-white shadow-lg space-y-2"
          align="start"
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option.label}
              onClick={() => handleSelect(option)} // Set selected option
              className={`px-3 py-2 ${
                selectedOption === option.label
                  ? "font-bold text-[#181818] bg-gray-100"
                  : "text-gray-700"
              }`}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
