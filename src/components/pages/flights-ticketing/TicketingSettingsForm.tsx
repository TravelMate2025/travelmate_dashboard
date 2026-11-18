"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import FlightsTicketingService, { TicketingSettings, TicketingSettingsInput } from "@/services/flightsTicketing";
import { pricingErrorMessage } from "@/hooks/api/pricing";
import { showSuccessToast } from "@/utils/toasters";

const SOURCES = [
  ["GDS", "GDS (airline fares through Amadeus)"],
  ["NDC", "NDC (airline direct content)"],
  ["LTC", "LTC (low-cost carriers, card needed)"],
  ["EAC", "EAC (Amadeus content, card needed)"],
] as const;

const label = "block text-[14px] font-[500] text-[#181818] mb-1";
const input = "w-full py-3 px-3 border-[#818489] border-[1px] rounded-[8px] outline-none bg-white";
const hint = "text-[12px] text-[#4E4F52] mt-1";
const err = "text-[12px] text-red-600 mt-1";
const h2 = "text-[16px] lg:text-[18px] font-semibold text-[#181818]";

type FormValues = Omit<TicketingSettingsInput, "agency_contact" | "excluded_carriers" | "remark_templates"> & {
  agency_contact: string;
  excluded_carriers: string;
  remark: string;
};

const schema = Yup.object({
  consolidator_office_id: Yup.string().matches(/^([A-Za-z0-9]{9})?$/, "9 letters and digits, e.g. LOSN82100"),
  queue_number: Yup.string().matches(/^(\d{1,3})?$/, "1 to 3 digits"),
  queue_category: Yup.string().matches(/^(\d{1,3})?$/, "1 to 3 digits"),
  payment_window_minutes: Yup.number().typeError("Enter minutes").integer().min(10, "At least 10 minutes").max(1440, "At most 24 hours").required(),
  ticketing_deadline_hours: Yup.number().typeError("Enter hours").integer().min(0).max(72, "At most 72 hours").required(),
  remark: Yup.string().max(60, "Up to 60 characters").test("ref", "Include {reference}", (v) => !v || v.includes("{reference}")),
  excluded_carriers: Yup.string().matches(/^\s*([A-Za-z0-9]{2}(\s*,\s*[A-Za-z0-9]{2})*)?\s*$/, "Two-character airline codes separated by commas, e.g. BA, AT"),
  agency_contact: Yup.string().test("json", "Must be a JSON object", (v) => {
    if (!v?.trim()) return true;
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed);
    } catch {
      return false;
    }
  }),
  enabled_sources: Yup.array().min(1, "Choose at least one source"),
});

const toForm = (s: TicketingSettings): FormValues => ({
  consolidator_name: s.consolidator_name,
  handoff_method: s.handoff_method,
  queue_number: s.queue_number,
  queue_category: s.queue_category,
  consolidator_office_id: s.consolidator_office_id,
  form_of_payment: s.form_of_payment,
  ticketing_agreement_option: s.ticketing_agreement_option,
  ticketing_deadline_hours: s.ticketing_deadline_hours,
  payment_window_minutes: s.payment_window_minutes,
  remark: s.remark_templates?.general ?? "",
  agency_contact: Object.keys(s.agency_contact ?? {}).length ? JSON.stringify(s.agency_contact, null, 2) : "",
  enabled_sources: s.enabled_sources?.length ? s.enabled_sources : ["GDS"],
  excluded_carriers: (s.excluded_carriers ?? []).join(", "),
});

const toPayload = (v: FormValues): TicketingSettingsInput => ({
  consolidator_name: v.consolidator_name.trim(),
  handoff_method: v.handoff_method,
  queue_number: v.queue_number.trim(),
  queue_category: v.queue_category.trim(),
  consolidator_office_id: v.consolidator_office_id.trim().toUpperCase(),
  form_of_payment: v.form_of_payment,
  ticketing_agreement_option: v.ticketing_agreement_option,
  ticketing_deadline_hours: Number(v.ticketing_deadline_hours),
  payment_window_minutes: Number(v.payment_window_minutes),
  remark_templates: v.remark.trim() ? { general: v.remark.trim() } : {},
  agency_contact: v.agency_contact.trim() ? JSON.parse(v.agency_contact) : {},
  enabled_sources: v.enabled_sources,
  excluded_carriers: v.excluded_carriers.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean),
});

const errorMessage = (e: unknown) => {
  const status = (e as { response?: { status?: number } })?.response?.status;
  return status === 403 ? "Only super admins can view or change ticketing settings." : pricingErrorMessage(e);
};

/** Flights → Ticketing settings: how a paid booking reaches the consolidator
 *  and how long customers have to pay. Read by the backend for every order. */
const TicketingSettingsForm = () => {
  const [settings, setSettings] = useState<TicketingSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSettings(await FlightsTicketingService.get());
      setLoadError(null);
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loadError) return <p role="alert" className="text-[14px] text-red-600">{loadError}</p>;
  if (!settings) return <p className="text-[14px] text-[#4E4F52]">Loading…</p>;

  const submit = async (values: FormValues) => {
    setSaveError(null);
    try {
      setSettings(await FlightsTicketingService.save(toPayload(values)));
      showSuccessToast({ message: "Ticketing settings saved" });
    } catch (e) {
      setSaveError(errorMessage(e));
    }
  };

  return (
    <Formik initialValues={toForm(settings)} validationSchema={schema} onSubmit={submit} enableReinitialize>
      {({ isSubmitting, values }) => (
        <Form className="space-y-8 max-w-[880px]">
          <section className="space-y-4" aria-labelledby="consolidator-h">
            <div>
              <h2 id="consolidator-h" className={h2}>Consolidator</h2>
              <p className={hint}>Who tickets our bookings, and how a paid booking is handed to them.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="consolidator_name">Consolidator name</label>
                <Field id="consolidator_name" name="consolidator_name" className={input} placeholder="Not chosen yet" />
              </div>
              <div>
                <label className={label} htmlFor="handoff_method">Handoff method</label>
                <Field as="select" id="handoff_method" name="handoff_method" className={input}>
                  <option value="queue">Place the booking on their queue</option>
                  <option value="owner_transfer">Transfer the booking to their office</option>
                  <option value="ticketing_office">Their office tickets it</option>
                </Field>
              </div>
              <div>
                <label className={label} htmlFor="consolidator_office_id">Consolidator office ID</label>
                <Field id="consolidator_office_id" name="consolidator_office_id" className={input} placeholder="e.g. LOSN82100" maxLength={9} />
                <ErrorMessage name="consolidator_office_id" component="p" className={err} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label} htmlFor="queue_number">Queue</label>
                  <Field id="queue_number" name="queue_number" className={input} inputMode="numeric" placeholder="e.g. 50" />
                  <ErrorMessage name="queue_number" component="p" className={err} />
                </div>
                <div>
                  <label className={label} htmlFor="queue_category">Category</label>
                  <Field id="queue_category" name="queue_category" className={input} inputMode="numeric" />
                  <ErrorMessage name="queue_category" component="p" className={err} />
                </div>
              </div>
              <div>
                <label className={label} htmlFor="form_of_payment">Form of payment on the booking</label>
                <Field as="select" id="form_of_payment" name="form_of_payment" className={input}>
                  <option value="none">None (consolidator adds it)</option>
                  <option value="ACCOUNT">Account</option>
                  <option value="CASH">Cash</option>
                  <option value="NONREFUNDABLE">Non-refundable</option>
                </Field>
                <p className={hint}>Amadeus only accepts this when the booking is created.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="holds-h">
            <div>
              <h2 id="holds-h" className={h2}>Holding seats</h2>
              <p className={hint}>A booking holds the seats while the customer pays. Unpaid bookings are released at the payment deadline.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={label} htmlFor="payment_window_minutes">Time to pay (minutes)</label>
                <Field id="payment_window_minutes" name="payment_window_minutes" className={input} inputMode="numeric" />
                <ErrorMessage name="payment_window_minutes" component="p" className={err} />
              </div>
              <div>
                <label className={label} htmlFor="ticketing_agreement_option">If nobody tickets it</label>
                <Field as="select" id="ticketing_agreement_option" name="ticketing_agreement_option" className={input}>
                  <option value="DELAY_TO_CANCEL">The airline cancels it</option>
                  <option value="DELAY_TO_QUEUE">It goes to a queue</option>
                  <option value="CONFIRM">No time limit</option>
                </Field>
              </div>
              <div>
                <label className={label} htmlFor="ticketing_deadline_hours">Hours after the payment deadline</label>
                <Field id="ticketing_deadline_hours" name="ticketing_deadline_hours" className={input} inputMode="numeric" disabled={values.ticketing_agreement_option === "CONFIRM"} />
                <p className={hint}>Never later than the airline&apos;s last ticketing date.</p>
                <ErrorMessage name="ticketing_deadline_hours" component="p" className={err} />
              </div>
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="content-h">
            <div>
              <h2 id="content-h" className={h2}>Which flights we sell</h2>
              <p className={hint}>Applies to every search from the next one on.</p>
            </div>
            <fieldset>
              <legend className={label}>Content sources</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SOURCES.map(([code, text]) => (
                  <label key={code} className="flex items-center gap-2 text-[14px] text-[#181818]">
                    <Field type="checkbox" name="enabled_sources" value={code} /> {text}
                  </label>
                ))}
              </div>
              <ErrorMessage name="enabled_sources" component="p" className={err} />
            </fieldset>
            <div>
              <label className={label} htmlFor="excluded_carriers">Airlines we don&apos;t sell</label>
              <Field id="excluded_carriers" name="excluded_carriers" className={input} placeholder="e.g. BA, AT" />
              <ErrorMessage name="excluded_carriers" component="p" className={err} />
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="pnr-h">
            <div>
              <h2 id="pnr-h" className={h2}>On the booking</h2>
              <p className={hint}>Added to every airline booking (PNR) we create.</p>
            </div>
            <div>
              <label className={label} htmlFor="remark">Remark</label>
              <Field id="remark" name="remark" className={input} placeholder="TRAVELMATE {reference}" />
              <p className={hint}>{"{reference}"} becomes our booking reference, e.g. TMF7Q2K9XA. Empty uses the default.</p>
              <ErrorMessage name="remark" component="p" className={err} />
            </div>
            <div>
              <label className={label} htmlFor="agency_contact">Agency contact (Amadeus format, JSON)</label>
              <Field as="textarea" id="agency_contact" name="agency_contact" rows={6} className={`${input} font-mono text-[13px]`}
                placeholder={'{"companyName": "TravelMate", "emailAddress": "bookings@…"}'} />
              <p className={hint}>Keys: addresseeName, companyName, emailAddress, phones, address. Empty sends none.</p>
              <ErrorMessage name="agency_contact" component="p" className={err} />
            </div>
          </section>

          {saveError && <p role="alert" className="text-[14px] text-red-600">{saveError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-[#4E4F52]">
              {settings.updated_by ? `Last saved by ${settings.updated_by}, ${new Date(settings.updated_at).toLocaleString()}` : "Not changed yet: defaults apply."}
            </p>
            <button type="submit" disabled={isSubmitting} className="bg-[#023E8A] text-white font-[500] rounded-[8px] px-5 py-3 disabled:opacity-60">
              {isSubmitting ? "Saving…" : "Save settings"}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default TicketingSettingsForm;
