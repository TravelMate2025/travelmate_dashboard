"use client";

import { useState } from "react";
import { useField } from "formik";

export const InputReuseables = ({ placeholder, label, name, type }: { placeholder: string; label: string; name: string; type: string }) => {
  const [field, meta] = useField(name);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative space-y-3">
      <p className="text-[14px] font-semibold text-[#181818] lg:text-[16px]">{label}</p>
      <div className="relative">
        <input {...field} id={name} type={type === "password" && showPassword ? "text" : type} placeholder={placeholder} className="w-full rounded-[18px] border border-[#d8dde6] bg-white px-4 py-4 text-[14px]" />
        {type === "password" && <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2">{showPassword ? "Hide" : "Show"}</button>}
      </div>
      {meta.touched && meta.error && <div className="mt-1 text-xs text-[#d72638]">{String(meta.error)}</div>}
    </div>
  );
};
