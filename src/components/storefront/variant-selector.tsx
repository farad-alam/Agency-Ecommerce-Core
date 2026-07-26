"use client";

import { useState } from "react";
import { Prisma } from "@prisma/client";
import { cn } from "@/lib/utils";

type Variant = Prisma.ProductVariantGetPayload<{}>;

export function VariantSelector({ 
  variants,
  onSelect
}: { 
  variants: Variant[];
  onSelect: (variant: Variant) => void;
}) {
  // Extract all unique option keys from all variants (e.g. "size", "color")
  const optionKeys = Array.from(
    new Set(
      variants.flatMap((v) => Object.keys(v.options as Record<string, string> || {}))
    )
  );

  // Default selections based on first available variant
  const defaultVariant = variants.find(v => v.inventoryQty > 0) || variants[0];
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    defaultVariant ? (defaultVariant.options as Record<string, string>) : {}
  );

  const handleSelectOption = (key: string, value: string) => {
    const newOptions = { ...selectedOptions, [key]: value };
    setSelectedOptions(newOptions);
    
    // Find matching variant
    const matchingVariant = variants.find(v => {
      const opts = v.options as Record<string, string>;
      return Object.entries(newOptions).every(([k, val]) => opts[k] === val);
    });

    if (matchingVariant) {
      onSelect(matchingVariant);
    }
  };

  if (optionKeys.length === 0 || (optionKeys.length === 1 && optionKeys[0] === "variant" && variants.length === 1 && (variants[0].options as any)?.variant === "Default")) {
    return null; // Don't render selector if there are no meaningful options
  }

  return (
    <div className="space-y-4">
      {optionKeys.map(key => {
        // Find all unique values for this key across all variants
        const values = Array.from(new Set(variants.map(v => (v.options as Record<string, string>)?.[key]).filter(Boolean)));
        
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 capitalize mb-2">{key}</label>
            <div className="flex flex-wrap gap-2">
              {values.map(val => {
                const isSelected = selectedOptions[key] === val;
                // Check if this option combination is in stock
                const testOptions = { ...selectedOptions, [key]: val };
                const variantForTest = variants.find(v => {
                  const opts = v.options as Record<string, string>;
                  return Object.entries(testOptions).every(([k, vval]) => opts[k] === vval);
                });
                
                const isAvailable = variantForTest ? variantForTest.inventoryQty > 0 : false;
                
                return (
                  <button
                    key={val}
                    onClick={() => handleSelectOption(key, val)}
                    className={cn(
                      "px-4 py-2 text-sm border rounded-md transition-colors",
                      isSelected 
                        ? "border-black bg-black text-white" 
                        : "border-gray-200 text-gray-900 hover:border-gray-300",
                      !isAvailable && !isSelected && "opacity-50 line-through"
                    )}
                  >
                    {val}
                  </button>
                )
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
