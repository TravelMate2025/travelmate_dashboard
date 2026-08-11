"use client";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import { formatDistanceToNow, parseISO, format, addDays } from "date-fns";
import {
  TableDropdown,
  TicketDetailsDialog,
  ViewingChatModal,
} from "./Reuseables";
import { useGetAllEscalatedTickets, useGetTicket } from "@/hooks/api/ticket";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EscalatedTicketChatModal,
  EscalatedTicketDetailsDialog,
} from "./Reuseables";

type EscalatedTableProps = {
  searchTerm?: string;
  date?: string;
};

type EscalatedTicket = {
  id: string;
  title?: string;
  ticket_id?: string;
  category?: string;
  status?: string;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  escalated_by?: {
    first_name?: string;
    email?: string;
  };
  escalated_at?: string;
  escalation_role?: {
    name?: string;
  };
};

type EscalatedTicketFilters = {
  status?: string;
  search?: string;
  date?: string;
};

export const EscaleteTable: React.FC<EscalatedTableProps> = ({
  searchTerm,
  date,
}) => {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState<EscalatedTicket | null>(
    null
  );
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { tickets, loading, error, setFilters } = useGetAllEscalatedTickets();

  const { ticket: ticketDetails, loadingTicket } = useGetTicket({
    TicketId: ticketId as string,
    initalFetch: !!ticketId,
  });

  const handleViewDetails = (ticket: EscalatedTicket) => {
    setIsDetailsDialogOpen(true);
    setIsChatModalOpen(false); // Ensure chat modal is closed
    setSelectedTicket(ticket);
    setTicketId(ticket.id);
  };

  const handleViewMessage = (ticket: EscalatedTicket) => {
    setIsChatModalOpen(true);
    setIsDetailsDialogOpen(false); // Ensure details dialog is closed
    setSelectedTicket(ticket);
    setTicketId(ticket.id);
  };

  const handleDetailsDialogClose = () => {
    setIsDetailsDialogOpen(false);
    setSelectedTicket(null);
    setTicketId(null);
  };

  const handleChatModalClose = () => {
    setIsChatModalOpen(false);
    setSelectedTicket(null);
    setTicketId(null);
  };

  useEffect(() => {
    const filters: EscalatedTicketFilters = {};
    filters.status = statusFilter === "all" ? "" : statusFilter;
    if (searchTerm) {
      filters.search = searchTerm;
    }
    if (date) {
      filters.date = date as string;
    }
    setFilters(filters);
  }, [statusFilter, searchTerm, date, setFilters]);

  const handleTabChange = (value: string) => {
    setStatusFilter(value);
    setFilters({ status: value === "all" ? "" : value });
  };

  const lastEscalationRoleName = tickets?.length
    ? tickets[tickets.length - 1]?.escalation_role?.name || "No Role Found"
    : "No Tickets Available";

  const styling =
    "px-[24px] h-full  data-[state=active]:text-black data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-[2px] data-[state=active]:border-b-[#181818] flex items-center justify-center cursor-pointer bg-transparent shadow-none rounded-none";

  return (
    <>
      <div className="space-y-[32px]">
        <div className="flex justify-between items-center mb-4 px-[16px]">
          <h2 className="lg:text-[20px] text-[14px] text-[#181818] font-[500] lg:font-[600]">
            Tickets
          </h2>
        </div>

        <Tabs
          defaultValue="all"
          className="space-y-[40px]"
          onValueChange={handleTabChange}
        >
          <TabsList className="w-full flex justify-center items-center border-b-[1px] border-[#ACAEB3] bg-transparent shadow-none rounded-none pb-0">
            <TabsTrigger value="all" className={styling}>
              All
            </TabsTrigger>
            <TabsTrigger value="new" className={styling}>
              New
            </TabsTrigger>
            <TabsTrigger value="in_progress" className={styling}>
              In Progress
            </TabsTrigger>
            <TabsTrigger value="resolved" className={styling}>
              Resolved
            </TabsTrigger>
          </TabsList>
          {loading ? (
            <Skeleton />
          ) : (
            <>
              {tickets.length === 0 ? (
                <div className="h-[40px] flex justify-center items-center">
                  <p className="ttext-[20px] font-[500] text-[#181818]">
                    No data found
                  </p>
                </div>
              ) : (
                <div className="lg:px-[24px] px-[16px]">
                  <Table className="border-none border-collapse">
                    <TableHeader>
                      <TableRow className="items-center border-none hover:bg-none">
                        <TableCell className="font-semibold border-none">
                          Subject
                        </TableCell>
                        <TableCell className="font-semibold border-none">
                          Customer
                        </TableCell>
                        <TableCell className="font-semibold border-none">
                          Escalated By
                        </TableCell>
                        <TableCell className="font-semibold border-none">
                          Assigned to
                        </TableCell>
                        <TableCell className="font-semibold border-none">
                          Status
                        </TableCell>
                        <TableCell className="font-semibold border-none">
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((rawTicket, index: number) => {
                        const ticket = rawTicket as unknown as EscalatedTicket;
                        return (
                        <TableRow
                          key={`${ticket.id}-${index}`}
                          className="items-center cursor-pointer border-none"
                        >
                          <TableCell className="border-none">
                            <div className="flex items-center space-x-4">
                              <img
                                src="/assets/icons/flight_cancellation.svg"
                                alt="icon"
                                className="w-[30px] lg:w-[40px]"
                              />
                              <div className="space-y-[8px]">
                                <h2 className="font-medium text-[#181818] text-[14px] lg:text-[16px]">
                                  {ticket.title}
                                </h2>
                                <p className="text-[#9B9EA4] text-[12px]">
                                  {ticket.ticket_id} • {ticket.category}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className=" border-none">
                            <div className="space-y-2">
                              <p className="text-[#181818] text-[14px] font-[500] capitalize">
                                {ticket.user?.first_name || "---"}{" "}
                                {ticket.user?.last_name || "---"}
                              </p>
                              <p className="text-[#9B9EA4] text-[12px]">
                                {ticket.user?.email || "---"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className=" border-none">
                            <div className="space-y-2">
                              <p className="text-[#181818] text-[14px] font-[500]">
                                {ticket?.escalated_by?.first_name ||
                                  ticket?.escalated_by?.email}
                              </p>
                              <p className="text-[#9B9EA4] text-[12px] space-x-[2px] items-center flex">
                                {ticket?.escalated_at ? (
                                  <>
                                    <span>
                                      {format(
                                        new Date(ticket.escalated_at),
                                        "dd/MM/yyyy"
                                      )}
                                    </span>
                                    <span className="w-1 h-1 bg-[#9B9EA4] rounded-full mx-1"></span>
                                    <span>
                                      {format(
                                        new Date(ticket.escalated_at),
                                        "hh:mmaaa"
                                      )}
                                    </span>
                                  </>
                                ) : (
                                  "N/A"
                                )}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className=" border-none">
                            <div className="space-y-2">
                              <p className="text-[#181818] text-[14px] font-[500]">
                                {ticket.escalation_role?.name || "N/A"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="border-none whitespace-nowrap">
                            <span
                              className={`px-4 py-3 rounded-md text-[10px] lg:text-[12px] ${
                                ticket.status === "new"
                                  ? "bg-[#CCD8E8] text-[#181818]"
                                  : ticket.status === "in_progress"
                                  ? "bg-[#EFB60880]/50  text-[#181818]"
                                  : ticket.status === "resolved"
                                  ? "bg-[#2D9C5E80]/50  text-[#181818]"
                                  : "bg-gray-100 text-gray-600" // fallback for other/unknown statuses
                              }`}
                            >
                              {(ticket.status || "unknown").replace("_", " ").toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell className="border-none">
                            <TableDropdown
                              parentWidth={150}
                              onViewDetails={() => handleViewDetails(ticket)}
                              onViewMessage={() => handleViewMessage(ticket)}
                            />
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </Tabs>
      </div>
      <EscalatedTicketDetailsDialog
        selectedTicket={isDetailsDialogOpen}
        onClose={handleDetailsDialogClose}
        ticketDetails={selectedTicket}
        ticketLoading={loadingTicket}
      />

      <EscalatedTicketChatModal
        selectedTicket={isChatModalOpen}
        onClose={handleChatModalClose}
        ticketDetails={selectedTicket}
        ticketLoading={loadingTicket}
      />
    </>
  );
};

export function getRelativeTime(timestamp: string): string {
  const date = parseISO(timestamp);
  return formatDistanceToNow(date, { addSuffix: true });
}

const Skeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="w-full space-y-[12px] mt-5 px-4 ">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex justify-between items-center w-full"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="bg-gray-300 animate-pulse h-[50px] w-[24%] rounded-[12px]"
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
};
