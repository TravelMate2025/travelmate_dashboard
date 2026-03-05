"use client";
import React, { useState } from "react";
import { useMyRoles } from "@/hooks/api/roles";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEditServices } from "@/hooks/api/cms";
import { Formik, Form, Field } from "formik";
import { AlertTriangle } from "lucide-react";
import * as Yup from "yup";

type EditDialogProps = {
  serviceId: string;
  refresh?: () => void;
  canEdit: boolean;
};

const EditDialog = ({ serviceId, refresh, canEdit }: EditDialogProps) => {
  const { onCMSdata, loading } = useEditServices();
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Separate state for success modal

  const handleSubmit = async (values: { percentage: string }) => {
    try {
      await onCMSdata({
        id: serviceId,
        payload: values,
      });

      setShowSuccessModal(true); // Show success modal
      // Trigger refresh in the background
      refresh?.();
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };

  const validationSchema = Yup.object({
    percentage: Yup.number()
      .required("Commission rate is required")
      .min(0, "Percentage must be at least 0")
      .max(100, "Percentage must be at most 100"),
  });

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <button className="rounded-md text-[#023E8A] font-semibold text-xs lg:text-sm cursor-pointer">
            Edit
          </button>
        </DialogTrigger>
        <DialogContent className="p-0 min-w-[335px] lg:min-w-[800px]">
          <div className="py-6 space-y-4">
            <DialogHeader className="border-b-[1px] border-[#9B9EA4]">
              <DialogTitle className="px-6 pb-6">Stays Commission Rate</DialogTitle>
            </DialogHeader>
            {!canEdit ? (
              <NotAuthorizedModal />
            ) : (
              <div className="px-6 space-y-8">
                <Formik
                  initialValues={{ percentage: "" }}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isValid, values }) => (
                    <Form>
                      <div className="space-y-3">
                        <label className="block text-[14px] lg:text-[20px] font-[500] text-[#181818]">
                          Commission Rate
                        </label>
                        <div className="flex py-4 px-3 border-[#818489] border-[1px] rounded-[8px] space-x-2 items-center">
                          <img src="/assets/icons/percentage.svg" alt="" />
                          <Field
                            name="percentage"
                            type="text"
                            className="outline-none flex-1"
                            placeholder="Enter commission rate"
                          />
                        </div>
                        <div className="flex bg-[#F5F5F5] p-4 rounded-[12px] space-x-[10px] items-start">
                          <img src="/assets/icons/in-fo.svg" alt="" />
                          <p>
                            The commission rate is the percentage added on top of the base price
                            we receive from the third-party provider for flights.
                          </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="reset"
                            className="text-[#023E8A] border-[1px] border-[#023E8A] text-[20px] font-[500] cursor-pointer rounded-[8px] p-4"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-[#023E8A] text-white p-4 rounded-[8px] text-[20px] font-[500] cursor-pointer"
                            disabled={!isValid || !values.percentage}
                          >
                            {loading ? (
                              <div className="w-8 h-8 border-4 border-gray-200 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              "Save"
                            )}
                          </button>
                        </div>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Separate Success Modal */}
      {showSuccessModal && (
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="p-0">
            <div className="text-center p-6 flex flex-col space-y-4 items-center justify-center min-h-[250px]">
              <img src="/assets/icons/blue-success.svg" alt="" className="" />
              <h1 className="mt-4 text-[#181818] text-[20px] font-semibold">
                Rate Edited Successfully
              </h1>
              <p className="mt-4 text-gray-600">
                You have successfully updated rates
              </p>
              <button
                className="mt-4 bg-[#023E8A] text-white p-2 rounded-md"
                onClick={() => setShowSuccessModal(false)}
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};



const NotAuthorizedModal = () => {
  return (
    <div className="text-center p-6 flex flex-col space-y-4 items-center justify-center min-h-[250px]">
      <AlertTriangle className="w-20 h-20 mx-auto text-red-500" />
      <h1 className="mt-4 text-[#181818] text-[20px] font-semibold">
        You Perform this action.
      </h1>
      <p className="mt-4 text-gray-600">
        You don't belong to content management department
      </p>
    </div>
  );
};

export default EditDialog;
