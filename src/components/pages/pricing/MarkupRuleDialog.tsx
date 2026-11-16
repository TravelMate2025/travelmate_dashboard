"use client";
import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PricingService, { MarkupRule, MarkupRuleInput } from "@/services/pricing";
import { pricingErrorMessage } from "@/hooks/api/pricing";
import { showSuccessToast } from "@/utils/toasters";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: "flights" | "transfers";
  rule?: MarkupRule | null;
  onSaved: () => void;
};

const CABINS = ["", "ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];
const SOURCES = ["", "GDS", "NDC", "LTC", "EAC"];
const SUPPLIERS: Record<string, string[]> = {
  flights: ["", "amadeus_flights"],
  transfers: ["", "amadeus_transfers", "partner"],
};

const schema = Yup.object({
  name: Yup.string().trim().required("Give the rule a name"),
  percent: Yup.number().typeError("Enter a number").min(0, "At least 0").max(100, "At most 100").required("Enter a percentage (0 for none)"),
  fixed_usd: Yup.number().typeError("Enter a number").min(0, "At least 0").required("Enter an amount (0 for none)"),
  priority: Yup.number().typeError("Enter a whole number").integer("Enter a whole number").required(),
  origin_country: Yup.string().matches(/^([A-Za-z]{2})?$/, "Two letters, e.g. NG"),
  destination_country: Yup.string().matches(/^([A-Za-z]{2})?$/, "Two letters, e.g. GB"),
});

const label = "block text-[14px] font-[500] text-[#181818] mb-1";
const input = "w-full py-3 px-3 border-[#818489] border-[1px] rounded-[8px] outline-none bg-white";
const hint = "text-[12px] text-[#4E4F52] mt-1";
const err = "text-[12px] text-red-600 mt-1";

const blank = (product: "flights" | "transfers"): MarkupRuleInput => ({
  name: "",
  product,
  supplier: "",
  origin_country: "",
  destination_country: "",
  cabin: "",
  source: "",
  percent: "0",
  fixed_usd: "0",
  priority: 0,
  is_active: true,
});

const MarkupRuleDialog = ({ open, onOpenChange, product, rule, onSaved }: Props) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initial: MarkupRuleInput = rule ? { ...blank(product), ...rule } : blank(product);

  const submit = async (values: MarkupRuleInput) => {
    setSaving(true);
    setError(null);
    const payload = {
      ...values,
      origin_country: values.origin_country.toUpperCase(),
      destination_country: values.destination_country.toUpperCase(),
    };
    try {
      if (rule) await PricingService.updateRule(rule.id, payload);
      else await PricingService.createRule(payload);
      showSuccessToast({ message: rule ? "Markup rule updated" : "Markup rule added" });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(pricingErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 min-w-[335px] lg:min-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b-[1px] border-[#DEDFE1]">
          <DialogTitle className="px-6 py-5">{rule ? "Edit markup rule" : "Add markup rule"}</DialogTitle>
        </DialogHeader>
        <Formik initialValues={initial} validationSchema={schema} onSubmit={submit} enableReinitialize>
          <Form className="px-6 pb-6 space-y-5">
            <div>
              <label className={label} htmlFor="name">Name</label>
              <Field id="name" name="name" className={input} placeholder="e.g. Nigeria to UK, economy" />
              <ErrorMessage name="name" component="p" className={err} />
            </div>

            <div>
              <p className="text-[14px] font-[600] text-[#181818]">Applies to</p>
              <p className={hint}>Leave a field empty to match anything. The rule matching the most fields wins.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="origin_country">From country</label>
                <Field id="origin_country" name="origin_country" className={input} placeholder="Any, or e.g. NG" maxLength={2} />
                <ErrorMessage name="origin_country" component="p" className={err} />
              </div>
              <div>
                <label className={label} htmlFor="destination_country">To country</label>
                <Field id="destination_country" name="destination_country" className={input} placeholder="Any, or e.g. GB" maxLength={2} />
                <ErrorMessage name="destination_country" component="p" className={err} />
              </div>
              {product === "flights" && (
                <>
                  <div>
                    <label className={label} htmlFor="cabin">Cabin</label>
                    <Field as="select" id="cabin" name="cabin" className={input}>
                      {CABINS.map((c) => <option key={c} value={c}>{c ? c.replace("_", " ").toLowerCase() : "Any cabin"}</option>)}
                    </Field>
                  </div>
                  <div>
                    <label className={label} htmlFor="source">Content source</label>
                    <Field as="select" id="source" name="source" className={input}>
                      {SOURCES.map((s) => <option key={s} value={s}>{s || "Any source"}</option>)}
                    </Field>
                  </div>
                </>
              )}
              <div>
                <label className={label} htmlFor="supplier">Supplier</label>
                <Field as="select" id="supplier" name="supplier" className={input}>
                  {SUPPLIERS[product].map((s) => <option key={s} value={s}>{s || "Any supplier"}</option>)}
                </Field>
              </div>
            </div>

            <div>
              <p className="text-[14px] font-[600] text-[#181818]">Markup</p>
              <p className={hint}>A percentage of the converted price, a fixed amount in US dollars (converted to the customer&apos;s currency), or both.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={label} htmlFor="percent">Percentage (%)</label>
                <Field id="percent" name="percent" className={input} inputMode="decimal" />
                <ErrorMessage name="percent" component="p" className={err} />
              </div>
              <div>
                <label className={label} htmlFor="fixed_usd">Fixed amount (USD)</label>
                <Field id="fixed_usd" name="fixed_usd" className={input} inputMode="decimal" />
                <ErrorMessage name="fixed_usd" component="p" className={err} />
              </div>
              <div>
                <label className={label} htmlFor="priority">Priority</label>
                <Field id="priority" name="priority" className={input} inputMode="numeric" />
                <p className={hint}>Breaks ties between equally specific rules.</p>
                <ErrorMessage name="priority" component="p" className={err} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-[14px] text-[#181818]">
              <Field type="checkbox" name="is_active" /> Active
            </label>

            {error && <p role="alert" className="text-[14px] text-red-600">{error}</p>}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => onOpenChange(false)}
                className="text-[#023E8A] border-[1px] border-[#023E8A] font-[500] rounded-[8px] px-5 py-3">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="bg-[#023E8A] text-white font-[500] rounded-[8px] px-5 py-3 disabled:opacity-60">
                {saving ? "Saving…" : "Save rule"}
              </button>
            </div>
          </Form>
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default MarkupRuleDialog;
