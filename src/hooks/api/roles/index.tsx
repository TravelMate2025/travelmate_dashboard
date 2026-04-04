import { useState, useEffect, useRef, useCallback } from "react";
import RolesService from "@/services/roles";
import { useAuthContext } from "@/context/AuthContext";
import axios from "axios";

type MyRoleData = {
  id?: string | number;
  name?: string;
  is_superuser?: boolean;
  [key: string]: unknown;
};

export function useGetAllEscalationLevel({
  initalFetch = true,
  refresh = false,
}: {
  initalFetch?: boolean;
  refresh?: boolean;
}) {
  const [Levelloading, setLoading] = useState(false);
  const [Leveldata, setData] = useState<unknown | null>(null);

  const onEscalationLevel = async () => {
    setLoading(true);
    try {
      const res = await RolesService.getRoles();
      setData(res.data.results);
    } catch (error) {
      console.error("Error fetching escalation levels:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initalFetch || refresh) onEscalationLevel();
  }, [initalFetch, refresh]);

  return { Levelloading, Leveldata };
}

export function useMyRoles({
  modalVisible = false,
}: {
  modalVisible?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MyRoleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuthContext();
  const [isMounted, setIsMounted] = useState(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 1;

  const onGetMyRole = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await RolesService.getMyRole();
      const results = res?.data?.results;
      setData(Array.isArray(results) ? results[0] : results || null);
      retryCountRef.current = 0; // Reset retry on success
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : null;

      // Backend may intermittently return 502; fail softly and keep UI usable.
      if (status === 502) {
        setData(null);
        setError("Role service is temporarily unavailable");
        
        // Retry once after short delay on 502
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          setTimeout(() => {
            onGetMyRole();
          }, 1000);
        }
        return;
      }

      setData(null);
      setError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : "Unable to fetch role"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydration guard: only fetch after client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Skip fetch during SSR to prevent hydration mismatch
    if (isMounted && modalVisible && accessToken) {
      onGetMyRole();
    }
  }, [isMounted, modalVisible, accessToken, onGetMyRole]);

  return { loading, data, error };
}
