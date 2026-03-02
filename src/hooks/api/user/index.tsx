"use client";
import { useState, useEffect, useCallback } from "react";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import UserService from "@/services/user";
import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";
import { User, UsersResponse } from "@/types";

export function useUser({
  userId,
  initialFetch = true,
  successCallback,
  errorCallback,
}: {
  userId?: string;
  initialFetch?: boolean;
  successCallback?: (message: string) => void;
  errorCallback?: (props: { message?: string; description?: string }) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<User | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await UserService.getUser({ UserId: userId });
      setData(res.data);
      if (successCallback)
        successCallback("User Profile fetched successfully.");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorCallback)
        errorCallback({
          message: "An error occurred while fetching the user",
          description: errorMessage,
        });
      else
        showErrorToast({
          message: "An error occurred while fetching the user",
        });
    } finally {
      setIsLoading(false);
    }
  }, [userId, successCallback, errorCallback]);

  useEffect(() => {
    if (initialFetch) fetchUser();
  }, [initialFetch, fetchUser]);

  return { isLoading, data };
}

export const useUsers = ({
  endpoint = env.api.users,
}: {
  endpoint?: string;
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [previousPageUrl, setPreviousPageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isActive, setIsActive] = useState<string | null>(null);

  const [dateJoinedAfter, setDateJoinedAfter] = useState<string | null>(null);
  const [dateJoinedBefore, setDateJoinedBefore] = useState<string | null>(
    null
  );

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (isActive !== null) params.append("is_active", isActive);
    if (dateJoinedAfter) params.append("date_joined_after", dateJoinedAfter);
    if (dateJoinedBefore)
      params.append("date_joined_before", dateJoinedBefore);

    return `${endpoint}${params.toString() ? `?${params.toString()}` : ""}`;
  }, [searchTerm, isActive, dateJoinedAfter, dateJoinedBefore, endpoint]);

  const fetchUsers = useCallback(
    async (url?: string, reset = false) => {
      try {
        setIsLoading(true);

        const newEndpoint = url || buildUrl();
        const response = await instance.get(newEndpoint);
        const data: UsersResponse = response.data;

        setUsers((prev) =>
          reset ? data.results : [...prev, ...data.results]
        );
        setNextPageUrl(data.next);
        setPreviousPageUrl(data.previous);
      } catch (err) {
        showErrorToast({ message: "Failed to fetch users" });
      } finally {
        setIsLoading(false);
      }
    },
    [buildUrl]
  );

  useEffect(() => {
    fetchUsers(undefined, true);
  }, [fetchUsers]);

  const loadNext = () => {
    if (nextPageUrl) fetchUsers(nextPageUrl, false);
  };

  const loadPrevious = () => {
    if (previousPageUrl) fetchUsers(previousPageUrl, false);
  };

  const refetch = () => {
    fetchUsers(undefined, true);
  };

  return {
    users,
    loadNext,
    loadPrevious,
    isLoading,
    nextPageUrl,
    previousPageUrl,
    setSearchTerm,
    setIsActive,
    setDateJoinedAfter,
    setDateJoinedBefore,
    refetch,
  };
};

export const useDeactivateUser = () => {
  const [isLoading, setIsLoading] = useState(false);

  const onDeactivateUser = async ({
    payload,
    userId,
    successCallback,
  }: {
    payload: { reason?: string; additional_note?: string };
    userId: string;
    successCallback?: () => void;
  }) => {
    setIsLoading(true);

    const data = {
      additional_reason: payload.additional_note,
      reason_choices: payload.reason,
    };

    try {
      const res = await UserService.deactivateUser({ userId, data });
      const {
        message = res.data.Message || "🚀 User Deactivated successfully",
        description = "",
      } = res.data || {};

      showSuccessToast({ message, description });

      successCallback?.();
    } catch (error: unknown) {
      showErrorToast({
        message: "Unable to deactivate user at the moment",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, onDeactivateUser };
};

export const useReactivateUser = () => {
  const [isLoading, setIsLoading] = useState(false);

  const onReactivateUser = async ({
    payload,
    userId,
    successCallback,
  }: {
    payload: { reason?: string; additional_note?: string };
    userId: string;
    successCallback?: () => void;
  }) => {
    setIsLoading(true);

    const data = {
      additional_reason: payload.additional_note,
      reason_choices: payload.reason,
    };

    try {
      const res = await UserService.reactivateUser({ userId, data });
      const {
        message = res.data.Message || "🚀 User Reactivated successfully",
        description = "",
      } = res.data || {};

      showSuccessToast({ message, description });

      successCallback?.();
    } catch (error: unknown) {
      showErrorToast({
        message: "Unable to reactivate user at the moment",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, onReactivateUser };
};

export const useExportCSV = () => {
  const [isLoading, setIsLoading] = useState(false);

  const onExportCSV = async ({
    successCallback,
    errorCallback,
  }: {
    successCallback?: () => void;
    errorCallback?: (error: Error) => void;
  }) => {
    setIsLoading(true);

    try {
      const res = await UserService.exportCSV();
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "users.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      successCallback?.();

      showSuccessToast({
        message: "CSV Export Successful",
        description: "The user data has been exported to CSV format.",
      });
    } catch (error: unknown) {
      console.error("Error exporting CSV:", error);

      showErrorToast({
        message: "Export Failed",
        description: "An error occurred while exporting the CSV.",
      });

      errorCallback?.(
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, onExportCSV };
};

export const useDeleteUser = () => {
  const [isLoading, setIsLoading] = useState(false);

  const onDeleteUser = async ({
    userId,
    successCallback,
  }: {
    userId: string;
    successCallback?: () => void;
  }) => {
    setIsLoading(true);

    try {
      const res = await UserService.deleteUser({ userId });
      const {
        message = res.data.Message || "🚀 User Deleted successfully",
        description = "",
      } = res.data || {};

      showSuccessToast({ message, description });

      successCallback?.();
    } catch (error: unknown) {
      showErrorToast({
        message: "Unable to delete user at the moment",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, onDeleteUser };
};

export const useBulkDeleteUser = () => {
  const [isLoading, setIsLoading] = useState(false);

  const onBulkDeleteUser = async ({
    userIds,
    successCallback,
  }: {
    userIds: number[];
    successCallback?: () => void;
  }) => {
    setIsLoading(true);

    try {
      const res = await UserService.bulkDeleteUser({ userIds });
      const {
        message = res.data.Message || "🚀 Users deleted successfully",
        description = "",
      } = res.data || {};

      showSuccessToast({ message, description });

      successCallback?.();
    } catch (error: unknown) {
      showErrorToast({
        message: "Unable to delete users at the moment",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, onBulkDeleteUser };
};
