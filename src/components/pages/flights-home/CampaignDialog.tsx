"use client";
import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FlightsHomeService, { Campaign } from "@/services/flightsHome";
import { pricingErrorMessage } from "@/hooks/api/pricing";
import { showSuccessToast } from "@/utils/toasters";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; campaign?: Campaign | null; onSaved: () => void };

type Values = {
  label: string; headline: string; body: string; cta_label: string; route_origin: string; route_destination: string;
  country_code: string; starts_at: string; ends_at: string; is_active: boolean;
};

const label = "block text-[14px] font-[500] text-[#181818] mb-1";
const input = "w-full py-3 px-3 border-[#818489] border-[1px] rounded-[8px] outline-none bg-white";
const err = "text-[12px] text-red-600 mt-1";
const hint = "text-[12px] text-[#4E4F52] mt-1";

// <input type="datetime-local"> works in local time without a zone
const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

const schema = Yup.object({
  label: Yup.string().trim().max(60).required("Add a short label"),
  headline: Yup.string().trim().max(120).required("Add a headline"),
  body: Yup.string().trim().max(300).required("Add the text"),
  cta_label: Yup.string().trim().max(40).required("Add the button text"),
  country_code: Yup.string().matches(/^([A-Za-z]{2})?$/, "Two letters, or empty for every country"),
  route_origin: Yup.string().matches(/^([A-Za-z]{3})?$/, "A 3-letter code"),
  route_destination: Yup.string().matches(/^([A-Za-z]{3})?$/, "A 3-letter code"),
  starts_at: Yup.string().required("Choose when it starts"),
});

/** A promo card on the Flights home: text, optional route that prefills the
 *  search, country (or every country) and dates. */
const CampaignDialog = ({ open, onOpenChange, campaign, onSaved }: Props) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initial: Values = {
    label: campaign?.label ?? "",
    headline: campaign?.headline ?? "",
    body: campaign?.body ?? "",
    cta_label: campaign?.cta_label ?? "See fares",
    route_origin: campaign?.route_origin ?? "",
    route_destination: campaign?.route_destination ?? "",
    country_code: campaign?.country_code ?? "",
    starts_at: toLocal(campaign?.starts_at ?? new Date().toISOString()),
    ends_at: toLocal(campaign?.ends_at ?? null),
    is_active: campaign?.is_active ?? true,
  };

  const submit = async (v: Values) => {
    setSaving(true);
    setError(null);
    const payload = {
      ...v,
      country_code: v.country_code.toUpperCase(),
      route_origin: v.route_origin.toUpperCase(),
      route_destination: v.route_destination.toUpperCase(),
      starts_at: toIso(v.starts_at) as string,
      ends_at: toIso(v.ends_at),
    };
    try {
      if (campaign) await FlightsHomeService.updateCampaign(campaign.id, payload);
      else await FlightsHomeService.createCampaign(payload);
      showSuccessToast({ message: campaign ? "Promo card updated" : "Promo card added" });
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
          <DialogTitle className="px-6 py-5">{campaign ? "Edit promo card" : "Add promo card"}</DialogTitle>
        </DialogHeader>
        <Formik initialValues={initial} validationSchema={schema} onSubmit={submit} enableReinitialize>
          <Form className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="c-label">Label</label>
                <Field id="c-label" name="label" className={input} placeholder="Christmas deal" />
                <ErrorMessage name="label" component="p" className={err} />
              </div>
              <div>
                <label className={label} htmlFor="c-cta">Button text</label>
                <Field id="c-cta" name="cta_label" className={input} />
                <ErrorMessage name="cta_label" component="p" className={err} />
              </div>
            </div>
            <div>
              <label className={label} htmlFor="c-headline">Headline</label>
              <Field id="c-headline" name="headline" className={input} placeholder="Christmas in London" />
              <ErrorMessage name="headline" component="p" className={err} />
            </div>
            <div>
              <label className={label} htmlFor="c-body">Text</label>
              <Field as="textarea" id="c-body" name="body" rows={3} className={input} />
              <ErrorMessage name="body" component="p" className={err} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={label} htmlFor="c-country">Country</label>
                <Field id="c-country" name="country_code" className={`${input} uppercase`} maxLength={2} placeholder="Every country" />
                <ErrorMessage name="country_code" component="p" className={err} />
              </div>
              <div>
                <label className={label} htmlFor="c-from">Route from</label>
                <Field id="c-from" name="route_origin" className={`${input} uppercase`} maxLength={3} placeholder="Optional" />
                <ErrorMessage name="route_origin" component="p" className={err} />
              </div>
              <div>
                <label className={label} htmlFor="c-to">Route to</label>
                <Field id="c-to" name="route_destination" className={`${input} uppercase`} maxLength={3} placeholder="Optional" />
                <ErrorMessage name="route_destination" component="p" className={err} />
              </div>
            </div>
            <p className={hint}>A route prefills the search when the button is tapped. Give both ends, or neither.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="c-start">Starts</label>
                <Field id="c-start" name="starts_at" type="datetime-local" className={input} />
                <ErrorMessage name="starts_at" component="p" className={err} />
              </div>
              <div>
                <label className={label} htmlFor="c-end">Ends (optional)</label>
                <Field id="c-end" name="ends_at" type="datetime-local" className={input} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-[14px]"><Field type="checkbox" name="is_active" /> Active</label>
            {error && <p role="alert" className="text-[14px] text-red-600">{error}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => onOpenChange(false)} className="text-[#023E8A] border border-[#023E8A] font-[500] rounded-[8px] px-5 py-3">Cancel</button>
              <button type="submit" disabled={saving} className="bg-[#023E8A] text-white font-[500] rounded-[8px] px-5 py-3 disabled:opacity-60">
                {saving ? "Saving…" : "Save promo card"}
              </button>
            </div>
          </Form>
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDialog;
