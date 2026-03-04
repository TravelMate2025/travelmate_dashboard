"use client";
import { useState, useEffect, useMemo, useCallback, act } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SuccessModal } from "@/components/reuseables/SuccessModal";
import { useRouter } from "next/navigation";
import DateDialog, { DatePairDialog } from "@/components/reuseables/DateDialog";
import { parseISO, addDays, format, isValid, sub } from "date-fns";
import { useClaimTicket } from "@/hooks/api/ticket";
import { useResolveTicket } from "@/hooks/api/ticket";
import { useAuthContext } from "@/context/AuthContext";
import { useMyRoles } from "@/hooks/api/roles";
import { AlertTriangle } from "lucide-react";
import { FilterDropdown } from "@/components/reuseables/FilterDropdown";

type TicketActor = {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

type TicketClaimHistoryItem = {
  claimed_admin?: TicketActor;
  timestamp?: string;
};

type TicketDetails = {
  id: string;
  ticket_id?: string;
  category?: string;
  status?: string;
  title?: string;
  description?: string;
  created_at?: string;
  escalated?: boolean;
  escalated_at?: string;
  escalation_reason?: string;
  escalation_role?: {
    name?: string;
  };
  escalated_by?: TicketActor;
  claimed_admin?: TicketActor | null;
  user?: TicketActor;
  claim_history?: {
    results?: TicketClaimHistoryItem[];
  };
};

type TicketDetailsDialogProps = {
  selectedTicket: TicketDetails | null;
  ticketDetails: TicketDetails | null;
  ticketLoading: boolean;
  onClose: () => void;
};
export const TableDropdown = ({
  onViewDetails,
  onViewMessage,
}: {
  parentWidth: number;
  onViewDetails?: () => void;
  onViewMessage?: () => void;
}) => {
  const options = [
    { label: "View Ticket Details", action: onViewDetails },
    { label: "Open Ticket Chat", action: onViewMessage },
  ];

  return (
    <div className="relative overflow-visible">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer select-none px-2 py-1 text-lg">⋮</div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="bottom"
          align="end"
          className="z-50 max-w-[180px] shadow-lg border border-gray-200 rounded-md bg-white"
        >
          {options.map((option, index) => (
            <DropdownMenuItem
              key={index}
              onClick={option.action}
              className="cursor-pointer select-none"
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="space-y-2">
    <p className="text-[16px] font-[500] capitalize text-[#343537]">{label}</p>
    <span className="text-[14px] font-[400] text-[#343537]">{value}</span>
  </div>
);

export const TicketDetailsDialog = ({
  selectedTicket,
  ticketDetails,
  ticketLoading,
  onClose,
}: TicketDetailsDialogProps) => {
  const name = `${ticketDetails?.user?.first_name || "---"} ${
    ticketDetails?.user?.last_name || "---"
  }`;
  const formattedDate = formatCreatedAt(ticketDetails?.created_at, 2);
  return (
    <div
      className={`fixed inset-0 z-100 bg-black/50 ${
        selectedTicket ? "visible opacity-100" : "invisible opacity-0"
      } flex justify-end lg:items-center items-end transition-opacity duration-300`}
      onClick={onClose}
    >
      <div
        className={`bg-white w-full max-w-[600px] lg:max-w-[720px] py-3 rounded-t-[20px] lg:rounded-t-[0px] lg:rounded-l-[20px] h-[90vh] overflow-y-auto shadow-lg transform border-[1px] border-[#9B9EA4] space-y-6 ${
          selectedTicket ? "scale-100" : "scale-95"
        } transition-transform duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-[1px] w-full border-[#BCBEC2]">
          <h2 className="font-[600] text-[16px] lg:text-[28px] px-[16px] lg:px-[32px] py-[8px] text-[#181818]">
            Ticket Details
          </h2>
        </div>
        <div className="space-y-6">
          <div className="px-[16px] lg:px-[32px] space-y-6">
            <h2 className="text-[18px] font-[500] text-[#18181]">
              Ticket Information
            </h2>
            {ticketLoading ? (
              <Loading />
            ) : (
              <div className="grid grid-cols-3 gap-6">
                <DetailRow label="Ticket ID" value={ticketDetails?.ticket_id} />
                <DetailRow label="Category" value={ticketDetails?.category} />
                <DetailRow label="Status" value={ticketDetails?.status} />
                <DetailRow label="Created at" value={formattedDate} />
              </div>
            )}
          </div>

          <div className="border-[#9B9EA4]  border-b-[1px]"></div>
          <div className="px-[16px] lg:px-[32px] space-y-3">
            <h2 className="text-[18px] font-[500] text-[#18181]">
              Customer Information
            </h2>
            <div className="space-y-4">
              {ticketLoading ? (
                <Loading />
              ) : (
                <>
                  <DetailRow label="Customer’s Name" value={name} />
                  <DetailRow
                    label="Customer’s Email"
                    value={ticketDetails?.user.email}
                  />
                </>
              )}
            </div>
          </div>

          {ticketDetails?.claim_history?.length !== 0 && (
            <>
              <div className="border-[#9B9EA4]  border-b-[1px]"></div>
              <div className="px-[16px] lg:px-[32px] space-y-3">
                <h2 className="text-[18px] font-[500] text-[#18181]">
                  Claim History
                </h2>
                <div className="space-y-4">
                  {ticketLoading ? (
                    <Loading />
                  ) : (
                    <div className="sace-y-2">
                      {ticketDetails?.claim_history?.results?.map(
                        (text: TicketClaimHistoryItem, i: number) => (
                          <p
                            className="text-[14px] font-[600] text-[#343537]"
                            key={i}
                          >
                            {(() => {
                              const admin = text.claimed_admin;
                              const name =
                                admin?.first_name || admin?.last_name
                                  ? `${admin.first_name || ""} ${
                                      admin.last_name || ""
                                    }`.trim()
                                  : admin?.email || "---";
                              return `This chat was claimed by ${name} - ${formatCreatedAt(
                                text?.timestamp,
                                2
                              )}`;
                            })()}
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="border-[#9B9EA4]  border-b-[1px]"></div>
          <div className="px-[16px] lg:px-[32px] space-y-3">
            <h2 className="text-[18px] font-[500] text-[#18181]">
              Issue Description
            </h2>
            <div className="space-y-4">
              {ticketLoading ? (
                <Loading />
              ) : (
                <>
                  <DetailRow label="Subject" value={ticketDetails?.title} />
                  <DetailRow
                    label="Description"
                    value={ticketDetails?.description}
                  />
                </>
              )}
            </div>
          </div>
        </div>
        <button
          className="absolute top-[16px] right-[16px] text-gray-500 cursor-pointer"
          onClick={onClose}
          aria-label="Close dialog"
          title="Close dialog"
        >
          <img src="/assets/icons/modalClose.svg" alt="" className="w-[20px]" />
        </button>
      </div>
    </div>
  );
};

export const ViewingChatModal = ({
  selectedTicket,
  ticketDetails,
  ticketLoading,
  onClose,
}: {
  selectedTicket: boolean;
  ticketDetails: TicketDetails | null;
  ticketLoading: boolean;
  onClose: () => void;
}) => {
  const APP_STATE = useAuthContext();
  const router = useRouter();
  const { claiming, onClaiming } = useClaimTicket();
  const currentUser = APP_STATE?.user?.user_id;

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showNotAuthorized, setShowNotAuthorized] = useState(false); // New state

  const { loading, data } = useMyRoles({ modalVisible: selectedTicket });
  const canViewMessage =
    data?.current_permission_group_slugs?.includes("support-tickets");

  const formattedDate = useMemo(
    () => (ticketDetails ? formatCreatedAt(ticketDetails.created_at, 2) : ""),
    [ticketDetails]
  );

  // Check authorization first - this will be computed on every render
  const notAuthorized = useMemo(() => {
    if (!selectedTicket || !ticketDetails) return false;

    if (
      ticketDetails.escalated === true &&
      ticketDetails.escalation_role.name !== data?.name
    ) {
      return true;
    }

    return false;
  }, [selectedTicket, ticketDetails, data?.name]);

  const handleNavigateToResponse = useCallback(() => {
    if (ticketDetails?.id) {
      setIsRedirecting(true);
      router.push(`/Dashboard/support/ticket/${ticketDetails.id}/respond`);
    }
  }, [ticketDetails, router]);

  useEffect(() => {
    if (selectedTicket && !notAuthorized) {
      if (
        ticketDetails?.claimed_admin?.id === currentUser ||
        ticketDetails?.status === "resolved" ||
        (ticketDetails?.escalated === true &&
          ticketDetails?.escalation_role.name === data?.name)
      ) {
        handleNavigateToResponse();
      }
    }
  }, [
    selectedTicket,
    ticketDetails,
    currentUser,
    handleNavigateToResponse,
    data?.name,
    notAuthorized,
  ]);

  const handleClaimTicket = useCallback(
    (ticketDetails: TicketDetails) => {
      if (!ticketDetails?.id) return;

      if (!canViewMessage) {
        setShowNotAuthorized(true); // Show NotAuthorizedModal
        return;
      }

      onClaiming({
        TicketId: ticketDetails.id,
        successCallback: () =>
          router.push(`/Dashboard/support/ticket/${ticketDetails.id}/respond`),
      });

      console.log(`Claim ticket triggered for ticket ID: ${ticketDetails.id}`);
    },
    [onClaiming, router, canViewMessage]
  );

  const handleEscalateTicket = useCallback(() => {
    if (!canViewMessage) {
      setShowNotAuthorized(true); // Show NotAuthorizedModal
      return;
    }
    router.push(`/Dashboard/support/ticket/${ticketDetails?.id}/escalate`);
  }, [canViewMessage, router, ticketDetails]);

  const isTicketClaimed = ticketDetails?.claimed_admin !== null;
  const isClaimedByCurrentUser =
    ticketDetails?.claimed_admin?.id === currentUser;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center bg-black/50 transition-opacity duration-300 ${
        selectedTicket ? "visible opacity-100" : "invisible opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-white w-[90%] max-w-[720px] p-6 rounded-2xl shadow-lg border border-gray-300 transform transition-transform duration-300 ${
          selectedTicket ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title"
      >
        {isRedirecting && (
          <div className="absolute inset-0 bg-white/80 flex justify-center items-center rounded-2xl z-50 h-[400px]">
            <div className="w-12 h-12 border-4 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {showNotAuthorized ? (
          <NotAuthorizedModal
            ticketDetails={ticketDetails!}
            title={"You cannot perform this action."}
            subtible={"You do not belong in customer support department ."}
            show={false}
          />
        ) : notAuthorized ? (
          <NotAuthorizedModal ticketDetails={ticketDetails!} />
        ) : !isRedirecting ? (
          <>
            {ticketLoading ? (
              <div className="h-[300px] flex justify-center items-center">
                <div className="w-10 h-10 border-4 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !isTicketClaimed ? (
              <UnclaimedTicketSection
                ticketDetails={ticketDetails!}
                formattedDate={formattedDate}
                claiming={claiming}
                handleClaimTicket={handleClaimTicket}
                handleEscalateTicket={handleEscalateTicket}
              />
            ) : isClaimedByCurrentUser ? (
              <UnclaimedTicketSection
                ticketDetails={ticketDetails!}
                formattedDate={formattedDate}
                claiming={claiming}
                handleClaimTicket={handleClaimTicket}
                handleEscalateTicket={handleEscalateTicket}
              />
            ) : (
              <ClaimedTicketSection
                ticketDetails={ticketDetails!}
                claiming={claiming}
                handleClaimTicket={handleClaimTicket}
              />
            )}

            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 focus:outline-none"
              onClick={onClose}
              aria-label="Close Modal"
              title="Close Modal"
            >
              <img src="/assets/icons/modalClose.svg" alt="Close Modal" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};

const ClaimedTicketSection = ({
  ticketDetails,
  claiming,
  handleClaimTicket,
}: {
  ticketDetails: TicketDetails;
  claiming: boolean;
  handleClaimTicket: (ticketDetails: TicketDetails) => void;
}) => {
  const router = useRouter();
  return (
    <>
      <div className="border-b-[1px] w-full border-[#BCBEC2]">
        <h2 className="font-[600] text-[16px] lg:text-[28px] px-[16px] lg:px-[32px] py-[8px] text-[#181818]">
          Ticket Already claimed
        </h2>
      </div>

      <div className=" px-[16px] lg:px-[32px]">
        <p className="font-[400] text-[12px] lg:text-[16px]">
          This chat is currently being handled by{" "}
          {ticketDetails?.claimed_admin?.first_name ||
            ticketDetails?.claimed_admin?.email}
          . You can either view the ticket or claim it. Claiming the ticket will
          transfer responsibility to you, removing{" "}
          {ticketDetails?.claimed_admin?.first_name ||
            ticketDetails?.claimed_admin?.email}{" "}
          from the conversation. The customer will be notified of the change.
          Would you like to proceed?
        </p>
      </div>

      <div className="mt-10 border-t-[1px] border-[#BCBEC2]">
        <div className="px-[16px] lg:px-[32px] py-[10px] flex lg:space-x-[24px] flex-col  lg:flex-row  items-center justify-end space-y-2 lg:space-y-0 ">
          <div className="w-full lg:w-auto p-4 rounded-[8px] border-[1px] border-[#023E8A] justify-center flex items-center space-x-3 cursor-pointer">
            <span
              className="text-[#023E8A] text-[20px] font-[500]"
              onClick={() =>
                router.push(
                  `/Dashboard/support/ticket/${ticketDetails?.id}/respond`
                )
              }
            >
              View Only
            </span>
          </div>

          <div className="w-full lg:w-auto p-4 rounded-[8px] bg-[#023E8A] flex items-center space-x-3 justify-center cursor-pointer">
            <span
              className="text-[#fff] text-[20px] font-[500]"
              onClick={() => handleClaimTicket(ticketDetails)}
            >
              {claiming ? (
                <div className="w-5 h-5 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Yes, Proceed"
              )}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

const UnclaimedTicketSection = ({
  ticketDetails,
  formattedDate,
  handleClaimTicket,
  handleEscalateTicket,
  claiming,
}: {
  ticketDetails: TicketDetails;
  formattedDate: string;
  handleClaimTicket: (ticketDetails: TicketDetails) => void;
  handleEscalateTicket: () => void;
  claiming: boolean;
}) => {
  const router = useRouter();
  return (
    <>
      <div className="border-b-[1px] w-full border-[#BCBEC2]">
        <h2 className="font-[600] text-[16px] lg:text-[28px] px-[16px] lg:px-[32px] py-[8px] text-[#181818]">
          Ticket {ticketDetails?.ticket_id}
        </h2>
      </div>

      <div className="px-[16px] lg:px-[32px] grid grid-cols-3 gap-6">
        <DetailRow label="Created at" value={formattedDate} />
        <DetailRow label="Category" value={ticketDetails?.category} />
        <DetailRow label="Status" value={ticketDetails?.status} />
        <DetailRow label="Subject" value={ticketDetails?.title} />
      </div>

      <div className="px-[16px] lg:px-[32px]">
        <DetailRow label="Description" value={ticketDetails?.description} />
      </div>

      <div className="mt-10 border-t-[1px] border-[#BCBEC2]">
        <div className="px-[16px] lg:px-[32px] py-[10px] flex space-y-[20px] lg:space-y-0 lg:space-x-[40px] flex-col lg:flex-row items-center">
          <div
            className="p-4 rounded-[8px] border-[1px] w-full border-[#D72638] justify-center flex items-center space-x-3 cursor-pointer"
            onClick={handleEscalateTicket}
          >
            <img src="/assets/icons/MessageModal.svg" alt="" />
            <span className="text-[#D72638] lg:text-[20px] text-[12px] font-[500]">
              Escalate Ticket
            </span>
          </div>

          <div
            className="p-4 rounded-[8px] bg-[#023E8A] flex items-center space-x-3 w-full justify-center cursor-pointer"
            onClick={() => handleClaimTicket(ticketDetails)}
          >
            {claiming ? (
              <div className="w-5 h-5 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <img src="/assets/icons/ModalDanger.svg" alt="" />
                <span className="text-[#fff] lg:text-[20px] text-[12px] font-[500]">
                  Claim Ticket
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const formatCreatedAt = (isoDate: string, daysToAdd: number): string => {
  try {
    // Ensure the date is defined and valid
    if (!isoDate) throw new Error("Invalid date: undefined or empty string");

    const parsedDate = parseISO(isoDate);

    // Validate if the parsed date is valid
    if (!isValid(parsedDate)) throw new Error("Invalid ISO date string");

    // Add specified number of days
    const updatedDate = addDays(parsedDate, daysToAdd);

    // Format the date
    return format(updatedDate, "dd/MM/yyyy 'at' h:mm a");
  } catch (error) {
    return "Invalid date";
  }
};

export const Loading = () => {
  return (
    <div className="w-full space-y-3 ">
      <div className="w-full h-8 bg-gray-300 rounded-[8px] animate-pulse"></div>
    </div>
  );
};

export const Filter = ({
  searchTerm,
  setSearchTerm,
  datePickerOpen,
  setDatePickerOpen,
  selectedDate,
  setSelectedDate,
  selectedStartDate,
  setSelectedStartDate,
  selectedEndDate,
  setSelectedEndDate,
  activeTab,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  datePickerOpen: boolean;
  setDatePickerOpen: (value: boolean) => void;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  selectedStartDate: string;
  setSelectedStartDate: (value: string) => void;
  selectedEndDate: string;
  setSelectedEndDate: (value: string) => void;
  activeTab: string;
}) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setSearchTerm("");
    setInputValue("");
  }, [activeTab]);

  const handleApply = () => {
    if (activeTab === "chat") {
      console.log("Applying range:", selectedStartDate, selectedEndDate);
    } else {
      console.log("Applying single date:", selectedDate);
    }
  };

  return (
    <div className="w-full px-4 lg:px-0">
      <div
        className="
          flex flex-wrap justify-between items-center gap-4
          lg:flex-nowrap lg:space-x-12
        "
      >
        <div
          className="
            flex items-center flex-grow min-w-[220px] max-w-full
            border border-[#ACAEB3] rounded-full
            py-2 px-4
          "
        >
          <img
            src="/assets/icons/search.svg"
            alt="Search Icon"
            className="w-4 h-4 flex-shrink-0"
          />

          <input
            type="text"
            className="flex-grow ml-2 text-[16px] placeholder:text-[#9B9EA4] text-[#181818] placeholder:font-light focus:outline-none placeholder:text-[16px] font-[400] min-w-0"
            placeholder="Search by Name, Email or Ticket ID"
            value={inputValue}
            onChange={(e) => {
              const val = e.target.value;
              setInputValue(val);
              if (val === "") {
                setSearchTerm("");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchTerm(inputValue);
              }
            }}
          />
        </div>

        <div className="flex space-x-3">
          <div
            className="
            flex items-center  min-w-[220px] max-w-full gap-3
          "
          >
            <div
              className="
              flex items-center bg-white border border-[#EBECED] rounded-full
              py-3 px-5 cursor-pointer flex-shrink-0
              shadow-sm lg:shadow-none
            "
              onClick={() => setDatePickerOpen(true)}
            >
              <img
                src="/assets/icons/calendar.svg"
                alt="Calendar Icon"
                className="w-6 flex-shrink-0"
              />
              <div className="ml-2 flex flex-col lg:flex-row lg:items-center">
                <span className="text-[14px] font-light text-[#181818]">
                  Select Date
                </span>
                <span className="text-[14px] font-light text-[#9B9EA4] hidden xl:inline-block lg:ml-1 truncate max-w-[110px]">
                  {activeTab === "chat"
                    ? `${selectedStartDate || "yyyy-mm-dd"} to ${
                        selectedEndDate || "yyyy-mm-dd"
                      }`
                    : selectedDate || "yyyy-mm-dd"}
                </span>
              </div>
            </div>
          </div>

          {/* <button
            className="
            text-[#023E8A] text-[14px] font-[400] px-3 border border-[#023E8A]
            rounded-[8px] cursor-pointer flex-shrink-0
            whitespace-nowrap
          "
            onClick={handleApply}
          >
            Apply
          </button> */}
        </div>
      </div>

      {activeTab === "chat" ? (
        <DatePairDialog
          isOpen={datePickerOpen}
          onClose={() => setDatePickerOpen(false)}
          selectedStartDate={selectedStartDate}
          setSelectedStartDate={setSelectedStartDate}
          selectedEndDate={selectedEndDate}
          setSelectedEndDate={setSelectedEndDate}
        />
      ) : (
        <DateDialog
          isOpen={datePickerOpen}
          onClose={() => setDatePickerOpen(false)}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      )}
    </div>
  );
};

export const ConfirmResolution = ({
  selectedTicket,
  onClose,
  setShowModal,
}: {
  selectedTicket: TicketDetails | null;
  onClose: () => void;
  setShowModal: (value: boolean) => void;
}) => {
  const { resolving, onResolveTicket } = useResolveTicket();

  const handleResolution = () => {
    if (!selectedTicket?.id) return;
    onResolveTicket({
      TicketId: selectedTicket.id,
      successCallback: () => {
        onClose();
        setShowModal(true);
      },
    });
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-300 ${
        selectedTicket ? "visible opacity-100" : "invisible opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white w-full max-w-[600px] lg:max-w-[720px] py-3 rounded-[20px] shadow-lg border border-[#9B9EA4] space-y-6 transition-transform duration-300 ${
          selectedTicket ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b w-full border-[#BCBEC2]">
          <h2 className="font-semibold text-[16px] lg:text-[28px] px-4 lg:px-8 py-2 text-[#181818]">
            Confirm Resolution
          </h2>
        </div>

        <div className="px-4 lg:px-8">
          <p className="font-normal text-[16px] lg:text-[20px]">
            Are you sure you want to mark this ticket as resolved? This will
            close the conversation with the customer, and they will be notified
            that their issue has been resolved.
          </p>
        </div>

        <div className="mt-10 border-t border-[#BCBEC2]">
          <div className="px-4 lg:px-8 py-4 flex space-x-6 items-center justify-end">
            <button
              className="p-4 rounded-lg border border-[#023E8A] text-[#023E8A] text-[16px] font-medium"
              onClick={onClose}
              disabled={resolving}
            >
              Cancel
            </button>

            <button
              className={`p-4 rounded-lg text-white text-[16px] font-medium ${
                resolving
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#023E8A] hover:bg-[#012D65]"
              }`}
              onClick={handleResolution}
              disabled={resolving}
            >
              {resolving ? (
                <div className="w-6 h-6 border-4 border-gray-200 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Confirm Resolution"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EscalatedTicketChatModalProps {
  selectedTicket: boolean;
  ticketDetails: TicketDetails | null;
  ticketLoading: boolean;
  onClose: () => void;
}

const NotAuthorizedModal = ({
  ticketDetails,
  title,
  subtible,
  show = true,
}: {
  ticketDetails: TicketDetails;
  title?: string;
  subtible?: string;
  show?: boolean;
}) => {
  const router = useRouter();
  return (
    <div className="text-center p-6 flex flex-col space-y-4 items-center justify-center min-h-[400px]">
      <AlertTriangle className="w-20 h-20 mx-auto text-red-500" />
      <h1 className="mt-4 text-[#181818] text-[20px] font-semibold">
        {title || "You cannot view this message."}
      </h1>
      <p className="mt-4 text-gray-600">
        {subtible ||
          "You don't belong to the department the ticket was escalated to."}
      </p>

      {show && (
        <div
          className="p-4 rounded-[8px] bg-[#023E8A] flex items-center space-x-3 justify-center cursor-pointer"
          onClick={() =>
            router.push(`/Dashboard/support/ticket/${ticketDetails.id}/respond`)
          }
        >
          <>
            <span className="text-[#fff] text-[20px] font-[500]">
              View Chat Only
            </span>
          </>
        </div>
      )}
    </div>
  );
};

export const EscalatedTicketChatModal: React.FC<
  EscalatedTicketChatModalProps
> = ({ selectedTicket, ticketDetails, ticketLoading, onClose }) => {
  const router = useRouter();
  const { loading, data } = useMyRoles({ modalVisible: selectedTicket });

  const canViewMessage = data?.name === ticketDetails?.escalation_role?.name;

  const handleNavigateToResponse = useCallback(() => {
    if (ticketDetails?.id) {
      router.push(`/Dashboard/support/ticket/${ticketDetails.id}/respond`);
    }
  }, [ticketDetails, router]);

  useEffect(() => {
    if (selectedTicket && canViewMessage) {
      handleNavigateToResponse();
    }
  }, [selectedTicket, canViewMessage, handleNavigateToResponse]);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center bg-black/50 transition-opacity duration-300 ${
        selectedTicket ? "visible opacity-100" : "invisible opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-white w-[90%] max-w-[720px] min-h-[400px] p-6 rounded-2xl shadow-lg border border-gray-300 transform transition-transform duration-300 ${
          selectedTicket ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {loading || ticketLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl z-50">
            <div className="w-12 h-12 border-4 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !canViewMessage ? (
          <div
            id="modal-description"
            className="text-center flex items-center justify-center min-h-[400px] space-y-4"
          >
            <div className="">
              <AlertTriangle className="w-20 h-20 mx-auto text-red-500" />
              <h1 className="mt-4 text-[#181818] text-[20px] font-semibold">
                Access Restricted
              </h1>
              <p className="mt-4 text-gray-600">
                You don't have permission to claim or Edit this ticket. YOu can
                only view.
              </p>

              <div
                className="p-4 mt-5 rounded-[8px] bg-[#023E8A] flex items-center space-x-3 justify-center cursor-pointer"
                onClick={() =>
                  router.push(
                    `/Dashboard/support/ticket/${ticketDetails?.id}/respond`
                  )
                }
              >
                <>
                  <span className="text-[#fff] text-[20px] font-[500]">
                    View Chat Only
                  </span>
                </>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <button
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 focus:outline-none"
        onClick={onClose}
        aria-label="Close Modal"
        title="Close Modal"
      >
        <img src="/assets/icons/modalClose.svg" alt="Close Modal" />
      </button>
    </div>
  );
};

export const EscalatedTicketDetailsDialog = ({
  selectedTicket,
  ticketDetails,
  ticketLoading,
  onClose,
}: {
  selectedTicket: boolean;
  ticketDetails: TicketDetails | null;
  ticketLoading: boolean;
  onClose: () => void;
}) => {
  const name = `${ticketDetails?.user?.first_name || "---"} ${
    ticketDetails?.user?.last_name || "---"
  }`;
  const formattedDate = formatCreatedAt(ticketDetails?.created_at, 2);

  return (
    <div
      className={`fixed inset-0 z-100 bg-black/50 ${
        selectedTicket ? "visible opacity-100" : "invisible opacity-0"
      } flex justify-end lg:items-center items-end transition-opacity duration-300`}
      onClick={onClose}
    >
      <div
        className={`bg-white w-full max-w-[600px] lg:max-w-[720px] py-3 rounded-t-[20px] lg:rounded-t-[0px] lg:rounded-l-[20px] h-[90vh] overflow-y-auto shadow-lg transform border-[1px] border-[#9B9EA4] space-y-6 ${
          selectedTicket ? "scale-100" : "scale-95"
        } transition-transform duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-[1px] w-full border-[#BCBEC2]">
          <h2 className="font-[600] text-[16px] lg:text-[28px] px-[16px] lg:px-[32px] py-[8px] text-[#181818]">
            Ticket Details
          </h2>
        </div>
        <div className="space-y-6">
          <div className="px-[16px] lg:px-[32px] space-y-6">
            <h2 className="text-[18px] font-[500] text-[#18181]">
              Ticket Information
            </h2>
            {ticketLoading ? (
              <Loading />
            ) : (
              <div className="grid grid-cols-3 gap-6">
                <DetailRow label="Ticket ID" value={ticketDetails?.ticket_id} />
                <DetailRow label="Category" value={ticketDetails?.category} />
                <DetailRow label="Status" value={ticketDetails?.status} />
                <DetailRow label="Created at" value={formattedDate} />
                {ticketDetails?.escalated && (
                  <DetailRow
                    label="Escalated at"
                    value={formatCreatedAt(ticketDetails?.escalated_at, 2)}
                  />
                )}
              </div>
            )}
          </div>
          {ticketDetails?.claim_history?.results?.length > 0 && (
            <>
              <div className="border-[#9B9EA4] border-b-[1px]"></div>
              <div className="px-[16px] lg:px-[32px] space-y-3">
                <h2 className="text-[18px] font-[500] text-[#18181]">
                  Previously handled by
                </h2>
                <div className="space-y-4">
                  {ticketLoading ? (
                    <Loading />
                  ) : (
                    <div className="space-y-2">
                      {ticketDetails.claim_history.results.map(
                        (claim: TicketClaimHistoryItem, i: number) => (
                          <p
                            className="text-[14px] font-[400] text-[#343537]"
                            key={i}
                          >
                            {`This chat was claimed by ${
                              claim.claimed_admin?.first_name || "---"
                            } ${
                              claim.claimed_admin?.last_name || "---"
                            } - ${formatCreatedAt(claim.timestamp, 2)}`}
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="border-[#9B9EA4] border-b-[1px]"></div>
          <div className="px-[16px] lg:px-[32px] space-y-3">
            <h2 className="text-[18px] font-[500] text-[#18181]">
              Escalation Details
            </h2>
            <div className="space-y-4">
              {ticketLoading ? (
                <Loading />
              ) : (
                <>
                  <div className="flex space-x-2">
                    <p>Escalated by :</p>
                    <span>
                      {ticketDetails?.escalated_by?.first_name ||
                        ticketDetails?.escalated_by?.email ||
                        "---"}
                    </span>
                  </div>
                  <div className="flex space-x-4">
                    <p>Escalated to :</p>
                    <span>{ticketDetails?.escalation_role?.name || "---"}</span>
                  </div>
                  <div className="flex space-x-4">
                    <p>Escalation Reason :</p>
                    <span className="">
                      {ticketDetails?.escalation_reason || "N/A"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-[#9B9EA4] border-b-[1px]"></div>
          <div className="px-[16px] lg:px-[32px] space-y-3">
            <h2 className="text-[18px] font-[500] text-[#18181]">
              Customer Information
            </h2>
            <div className="space-y-4">
              {ticketLoading ? (
                <Loading />
              ) : (
                <>
                  <DetailRow label="Customer’s Name" value={name} />
                  <DetailRow
                    label="Customer’s Email"
                    value={ticketDetails?.user?.email || "---"}
                  />
                </>
              )}
            </div>
          </div>

          <div className="border-[#9B9EA4] border-b-[1px]"></div>
          <div className="px-[16px] lg:px-[32px] space-y-3">
            <h2 className="text-[18px] font-[500] text-[#18181]">
              Issue Description
            </h2>
            <div className="space-y-4">
              {ticketLoading ? (
                <Loading />
              ) : (
                <>
                  <p>{ticketDetails?.description || "No description"}</p>
                  <DetailRow
                    label="Subject"
                    value={ticketDetails?.title || "---"}
                  />
                  <DetailRow
                    label="Description"
                    value={ticketDetails?.description || "---"}
                  />
                </>
              )}
            </div>
          </div>
        </div>
        <button
          className="absolute top-[16px] right-[16px] text-gray-500 cursor-pointer"
          onClick={onClose}
          aria-label="Close dialog"
          title="Close dialog"
        >
          <img src="/assets/icons/modalClose.svg" alt="" className="w-[20px]" />
        </button>
      </div>
    </div>
  );
};
