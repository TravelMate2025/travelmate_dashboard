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
import { useGetAllTickets, useGetTicket, type Ticket } from "@/hooks/api/ticket";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TicketTabContentProps = {
  searchTerm: string;
  date?: string;
};

type TicketItem = Ticket;

export const TicketTabContent: React.FC<TicketTabContentProps> = ({
  searchTerm,
  date,
}) => {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Add state to track previous values for comparison
  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm);
  const [prevDate, setPrevDate] = useState(date);

  const {
    tickets: fetchedTickets,
    loadNext,
    loading,
    error,
    nextPageUrl,
    setFilters,
  } = useGetAllTickets();

  const [tickets, setTickets] = useState<TicketItem[]>([]);

  const { ticket: ticketDetails, loadingTicket } = useGetTicket({
    TicketId: ticketId as string,
    initalFetch: !!ticketId,
  });

  // Function to trigger full reload
  const triggerFullReload = () => {
    setTickets([]); // Reset tickets array
    setIsInitialLoad(true); // Reset initial load flag
    setIsLoadingMore(false); // Reset loading more state
  };

  useEffect(() => {
    const filters: Record<string, string> = {};
    filters.status = statusFilter === "all" ? "" : statusFilter;
    if (searchTerm) {
      filters.search = searchTerm;
    }
    if (date) {
      filters.date = date as string;
    }

    // Check if searchTerm or date has changed from previous values
    if (searchTerm !== prevSearchTerm || date !== prevDate) {
      triggerFullReload();
      setPrevSearchTerm(searchTerm);
      setPrevDate(date);
    }

    setFilters(filters);
  }, [statusFilter, searchTerm, date, setFilters, prevSearchTerm, prevDate]);

  useEffect(() => {
    if (fetchedTickets && fetchedTickets.length > 0) {
      setTickets(fetchedTickets);
      setIsLoadingMore(false);
      setIsInitialLoad(false);
    }
  }, [fetchedTickets]);

  const handleTabChange = (value: string) => {
    setStatusFilter(value);

    // Trigger full reload when filter changes
    triggerFullReload();

    // Set filters to trigger data refetch
    const filters: Record<string, string> = {};
    filters.status = value === "all" ? "" : value;
    if (searchTerm) {
      filters.search = searchTerm;
    }
    if (date) {
      filters.date = date as string;
    }
    setFilters(filters);
  };

  const handleViewDetails = (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setTicketId(String(ticket.id));
    setIsDetailsDialogOpen(true);
  };

  const handleDetailsDialogClose = () => {
    setIsDetailsDialogOpen(false);
    setSelectedTicket(null);
    setTicketId(null);
  };

  const handleViewMessage = (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setTicketId(String(ticket.id));
    setIsChatModalOpen(true);
  };

  const handleChatModalClose = () => {
    setIsChatModalOpen(false);
    setSelectedTicket(null);
    setTicketId(null);
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    loadNext();
  };

  const normalizedSelectedTicketForDetails =
    isDetailsDialogOpen && selectedTicket
      ? {
          ...selectedTicket,
          escalation_reason: selectedTicket.escalation_reason ?? undefined,
        }
      : null;

  const normalizedTicketDetails = ticketDetails
    ? {
        ...ticketDetails,
        escalation_reason: ticketDetails.escalation_reason ?? undefined,
      }
    : null;

  const styling =
    "px-[24px] h-full data-[state=active]:text-black data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-[2px] data-[state=active]:border-b-[#181818] flex items-center justify-center cursor-pointer bg-transparent shadow-none rounded-none";

  return (
    <>
      <div className="space-y-[32px]">
        <div className="flex justify-between items-center mb-4 px-[16px]">
          <h2 className="lg:text-[20px] text-[14px] text-[#181818] font-[500] lg:font-[600]">
            Tickets
          </h2>
        </div>

        <Tabs
          value={statusFilter}
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

          {loading && tickets.length === 0 && isInitialLoad ? (
            <div className="h-[200px] flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : tickets.length === 0 && !loading ? (
            <div className="h-[40px] flex justify-center items-center">
              <p className="text-[20px] font-[500] text-[#181818]">
                No data found
              </p>
            </div>
          ) : (
            <div className="lg:px-[24px] px-[4px] relative">
              <div className="overflow-x-auto">
                <Table className="border-none border-collapse min-w-[600px]">
                  <TableHeader>
                    <TableRow className="items-center border-none hover:bg-none">
                      <TableCell className="font-semibold border-none min-w-[200px] whitespace-nowrap">
                        Subject
                      </TableCell>
                      <TableCell className="font-semibold border-none min-w-[180px] whitespace-nowrap">
                        Customer
                      </TableCell>
                      <TableCell className="font-semibold border-none whitespace-nowrap">
                        Created at
                      </TableCell>
                      <TableCell className="font-semibold border-none whitespace-nowrap">
                        Status
                      </TableCell>
                      <TableCell className="font-semibold border-none whitespace-nowrap">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket, index) => (
                      <TableRow
                        key={`${ticket.id}-${index}`}
                        className="items-center cursor-pointer border-none"
                      >
                        <TableCell className="border-none min-w-[200px] whitespace-nowrap">
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
                        <TableCell className="border-none min-w-[180px] whitespace-nowrap">
                          <div className="space-y-2">
                            <p className="text-[#181818] text-[14px] font-[500] capitalize">
                              {ticket.user.first_name || "---"}{" "}
                              {ticket.user.last_name || "---"}
                            </p>
                            <p className="text-[#9B9EA4] text-[12px]">
                              {ticket.user.email || "---"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="table-cell border-none whitespace-nowrap">
                          <div className="space-y-2">
                            <p className="text-[#181818] text-[14px] font-[500]">
                              {format(
                                parseISO(ticket.created_at),
                                "dd/MM/yyyy"
                              )}
                            </p>
                            <p className="text-[#9B9EA4] text-[12px]">
                              <span>{getRelativeTime(ticket.created_at)}</span>
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="border-none whitespace-nowrap">
                          <span
                            className={`px-4 py-3 rounded-md text-[10px] lg:text-[12px] ${
                              ticket.status === "new"
                                ? "bg-[#CCD8E8] text-[#181818]"
                                : ticket.status === "in_progress"
                                ? `bg-[#EFB60880]/50 ${
                                    ticket.escalated
                                      ? "text-red-500"
                                      : "text-[#181818]"
                                  }`
                                : ticket.status === "resolved"
                                ? "bg-[#2D9C5E80]/50 text-[#181818]"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {ticket.status.replace("_", " ").toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="border-none whitespace-nowrap">
                          <TableDropdown
                            parentWidth={180}
                            onViewDetails={() => handleViewDetails(ticket)}
                            onViewMessage={() => handleViewMessage(ticket)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {nextPageUrl && (
            <div className="flex justify-center mt-4">
              <button
                className="bg-[#EBECED] cursor-pointer rounded-[8px] px-[40px] py-[16px] flex items-center"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <div className="w-5 h-5 border-2 border-[#023E8A] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <p className="text-[#023E8A] text-[14px]">Load more</p>
                )}
              </button>
            </div>
          )}
        </Tabs>
      </div>

      <TicketDetailsDialog
        selectedTicket={normalizedSelectedTicketForDetails}
        ticketDetails={normalizedTicketDetails}
        ticketLoading={loadingTicket}
        onClose={handleDetailsDialogClose}
      />
      <ViewingChatModal
        selectedTicket={isChatModalOpen}
        ticketDetails={normalizedTicketDetails}
        ticketLoading={loadingTicket}
        onClose={handleChatModalClose}
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
