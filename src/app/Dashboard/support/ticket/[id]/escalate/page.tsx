"use client";
import { useState, useEffect } from "react";
import ContentWrapper from "@/components/reuseables/ContentWrapper";
import React from "react";
import { useFormik } from "formik";
import { SuccessModal } from "@/components/reuseables/SuccessModal";
import * as Yup from "yup";
import {
  DetailRow,
  formatCreatedAt,
} from "@/components/molecues/support/Reuseables";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Button from "@/components/reuseables/Button";
import { useParams } from "next/navigation";
import { useGetAllEscalationLevel } from "@/hooks/api/roles";
import {
  useGetTicket,
  useGetAllEscalationReasons,
  useEscalateTicket,
} from "@/hooks/api/ticket";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

const page = () => {
  const [showModal, setShowModal] = useState(false);
  const { id }: { id: string } = useParams();

  const { ticket, loadingTicket } = useGetTicket({
    TicketId: id as string,
    initalFetch: true,
    successCallback: (message) => {
      console.log(message);
    },
    errorCallback: (error) => {
      console.error(error);
    },
  });

  // if (loadingTicket) {
  //   return;
  // }

  return (
    <>
      <div>
        <ContentWrapper url="/Dashboard/support/ticket" >
          {loadingTicket ? (
            <div className="flex justify-center items-center h-full w-full ">
              <LoadingState />
            </div>
          ) : (
            <div className="bg-[#fff] shadow-md lg:rounded-[20px]">
              <EscalateDetails
                data={ticket}
                showModal={showModal}
                setShowModal={setShowModal}
              />
            </div>
          )}
        </ContentWrapper>
      </div>

      {showModal && (
        <SuccessModal
          title="Ticket escalated Successfully"
          description="You have successfully escalated this ticket."
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

const EscalateDetails = ({ data, showModal, setShowModal }: any) => {
  return (
    <div className="p-[40px] space-y-[24px]">
      <div>
        <h3 className="font-[500] lg:text-[16px] text-[14px] text-[#181818]">
          {data?.created_at
            ? format(
                new Date(data.created_at),
                "EEEE do 'of' MMM.yyyy | hh:mmaaa"
              )
            : "Date not available"}
        </h3>
      </div>
      <div>
        <h1 className="font-[600] text-[16px] lg:text-[28px] text-[#181818]">
          Escalate Issue #{data?.ticket_id}
        </h1>
      </div>
      <TicketDetails ticket={data} />
      <CustomerInfo user={data?.user} />
      <Selections
        id={data?.id}
        showModal={showModal}
        setShowModal={setShowModal}
      />
    </div>
  );
};

const Selections = ({ id, showModal, setShowModal }: any) => {
  const { escalating, onEscalateTicket } = useEscalateTicket();
  const { Leveldata, Levelloading } = useGetAllEscalationLevel({
    initalFetch: true,
  });
  const [selectedEmail, setSelectedEmail] = useState("");

  const handleDropdownSelect = (option: any) => {
    setSelectedEmail(option?.email || "");
  };
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      escalation_level: "",
      escalation_reason: "",
      escalation_note: "",
      escalation_response_time: "",
    },
    validationSchema: Yup.object({
      escalation_level: Yup.string().required("Escalation level is required"),
      escalation_reason: Yup.string().required("Reason is required"),
      escalation_note: Yup.string()
        .required("Note is required")
        .max(200, "Note cannot exceed 200 characters"),
      escalation_response_time: Yup.string().required(
        "Response time is required"
      ),
    }),
    onSubmit: (values) => {
      const payload = {
        escalation_role: values.escalation_level,
        escalation_reason: values.escalation_reason,
        escalation_note: values.escalation_note,
        escalation_response_time: values.escalation_response_time,
      };

      onEscalateTicket({
        TicketId: id,
        payload,
        successCallback: () => {
          setShowModal(true);
          router.push("/Dashboard/support/ticket/escalates");
        },
      });
    },
  });
  console.log(Leveldata);

  return (
    <>
      <form
        onSubmit={formik.handleSubmit}
        className="space-y-6 mt-[24px]"
        noValidate
      >
        <div className="space-y-10">
          <div className="space-y-6">
            <h1 className="text-[16px] font-[500] text-[#181818]">
              Department:
            </h1>
            <Dropdown
              options={Leveldata || []}
              placeholder="Select Department"
              onSelect={(option) => {
                formik.setFieldValue("escalation_level", option.id);
                handleDropdownSelect(option); // Ensure the option is passed to update the email
              }}
            />
            {formik.touched.escalation_level &&
              formik.errors.escalation_level && (
                <p className="text-red-500 text-sm">
                  {formik.errors.escalation_level}
                </p>
              )}
          </div>

          <div className="space-y-6">
            <h1 className="text-[16px] font-[500] text-[#181818]">
              Reason for Escalation:
            </h1>
            <input
              type="text"
              name="escalation_reason"
              placeholder="Provide reason for escalation"
              className="w-full p-4 rounded-[8px] bg-[#f5f5f5] placeholder:text-[#9b9ea4] text-[16px] font-[400]"
              value={formik.values.escalation_reason}
              onChange={formik.handleChange}
            />
            {formik.touched.escalation_reason &&
              formik.errors.escalation_reason && (
                <p className="text-red-500 text-sm">
                  {formik.errors.escalation_reason}
                </p>
              )}
          </div>

          <div className="space-y-6">
            <h1 className="text-[16px] font-[500] text-[#181818]">
              Escalation Note:
            </h1>
            <textarea
              name="escalation_note"
              maxLength={200}
              placeholder="Please provide additional information on what has been attempted so far"
              className="w-full p-4 rounded-[8px] bg-[#f5f5f5] placeholder:text-[#9b9ea4] text-[16px] font-[400]"
              value={formik.values.escalation_note}
              onChange={formik.handleChange}
            />
            {formik.touched.escalation_note &&
              formik.errors.escalation_note && (
                <p className="text-red-500 text-sm">
                  {formik.errors.escalation_note}
                </p>
              )}
          </div>

          <div className="space-y-6">
            <h1 className="text-[16px] font-[500] text-[#181818]">
              Escalation Response Time:
            </h1>
            <MiniDropdown
              options={[
                { id: "1hr", label: "1 Hour (Emergency)" },
                { id: "4hrs", label: "4 Hours (Urgent)" },
                { id: "24hrs", label: "24 Hours (High priority)" },
              ]}
              placeholder="Select response time"
              onSelect={(option) =>
                formik.setFieldValue("escalation_response_time", option?.id)
              }
            />
            {formik.touched.escalation_response_time &&
              formik.errors.escalation_response_time && (
                <p className="text-red-500 text-sm">
                  {formik.errors.escalation_response_time}
                </p>
              )}
          </div>

          <div>
            <Button
              title="ESCALATE REQUEST"
              variant={
                !formik.isValid || escalating || !formik.dirty ? "gray" : "blue"
              }
              full
              icon="/assets/icons/white-caution.svg"
              iconPosition="left"
              disabled={!formik.isValid || escalating || !formik.dirty}
              loading={escalating}
              size="16"
              weight="600"
              className="transition-all ease-in-out"
            />
          </div>
        </div>
      </form>
    </>
  );
};

type DropdownOption = {
  id: number;
  name: string;
  email: string;
};

type DropdownProps = {
  options: DropdownOption[];
  placeholder?: string;
  onSelect: (value: DropdownOption) => void;
};

const Dropdown = ({ options, placeholder, onSelect }: DropdownProps) => {
  const [selectedOption, setSelectedOption] = useState<DropdownOption | null>(
    null
  );

  const handleSelect = (option: DropdownOption) => {
    setSelectedOption(option);
    onSelect(option);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full p-4 rounded-full border-[#9b9ea4] border-[1px] flex justify-between bg-transparent">
          {selectedOption?.name || placeholder}
          <img src="/assets/icons/arrow-down.svg" alt="Dropdown Arrow" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)]"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            className="w-full text-center px-4 py-2 hover:bg-gray-200"
            onClick={() => handleSelect(option)}
          >
            {option.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type MiniDropdownOption = {
  id: string;
  label: string;
};

type MiniDropdownProps = {
  options: MiniDropdownOption[];
  placeholder?: string;
  onSelect: (value: MiniDropdownOption | null) => void;
};

const MiniDropdown = ({
  options,
  placeholder,
  onSelect,
}: MiniDropdownProps) => {
  const [selectedOption, setSelectedOption] =
    useState<MiniDropdownOption | null>(null);

  const handleSelect = (option: MiniDropdownOption) => {
    setSelectedOption(option);
    onSelect(option);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full p-4 rounded-full border-[#9b9ea4] border-[1px] flex justify-between bg-transparent">
          {selectedOption?.label || placeholder}
          <img src="/assets/icons/arrow-down.svg" alt="Dropdown Arrow" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)]"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.label}
            className="w-full text-center px-4 py-2 hover:bg-gray-200"
            onClick={() => handleSelect(option)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const CustomerInfo = ({ user }: any) => {
  const { email, first_name, last_name, mobile_number } = user || {};
  return (
    <div className="space-y-6">
      <h4 className="font-[500] text-[20px] text-[#181818]">
        Customer Information
      </h4>
      <div className="space-y-6 w-full">
        <div className="flex space-x-1">
          <div className="w-1/2">
            <p className="font-inter font-[400] text-[14px] leading-[100%] tracking-[0%] ">
              First Name
            </p>
          </div>
          <div className="w-1/2">
            <p className="font-inter font-[500] text-[15px]">
              {first_name || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex space-x-1">
          <div className="w-1/2">
            <p className="font-inter font-[400] text-[14px] leading-[100%] tracking-[0%] ">
              Last Name
            </p>
          </div>
          <div className="w-1/2">
            <p className="font-inter font-[500] text-[15px]">
              {last_name || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex space-x-1">
          <div className="w-1/2">
            <p className="font-inter font-[400] text-[14px] leading-[100%] tracking-[0%] ">
              Phone Number
            </p>
          </div>
          <div className="w-1/2">
            <p className="font-inter font-[500] text-[15px] break-all">
              {mobile_number || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex space-x-1">
          <div className="w-1/2">
            <p className="font-inter font-[400] text-[14px] leading-[100%] tracking-[0%] ">
              Email Address
            </p>
          </div>
          <div className="w-1/2">
            <p className="font-inter font-[500] text-[15px] break-all">
              {email || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TicketDetails = ({ ticket }: any) => {
  const formattedDate = formatCreatedAt(ticket?.created_at, 2);
  return (
    <div className="">
      <div className="space-y-6">
        <h4 className="font-[500] text-[20px] text-[#181818]">
          Customer Information
        </h4>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <DetailRow label="Created at" value={formattedDate} />
            <DetailRow label="Ticket ID" value={ticket?.ticket_id} />
            <DetailRow label="Category" value={ticket?.category} />
            <DetailRow label="Created at" value={formattedDate} />
          </div>

          <DetailRow label="Subject" value={ticket?.title} />
          <DetailRow label="Description" value={ticket?.description} />
        </div>
      </div>
    </div>
  );
};

const LoadingState = () => {
  return (
    <div className="">
      <div className="w-full h-[70vh] bg-gray-300 rounded-[20px] animate-pulse space-y-[20px]">
        <div className="p-[40px] space-y-[24px]">
          <div className="h-[20px] bg-gray-200 rounded w-[200px] animate-pulse"></div>
          <div className="h-[30px] bg-gray-200 rounded w-[300px] animate-pulse"></div>
          <div className="h-[20px] bg-gray-200 rounded w-[150px] animate-pulse"></div>
          <div className="h-[20px] bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-[20px] bg-gray-200 rounded w-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default page;
