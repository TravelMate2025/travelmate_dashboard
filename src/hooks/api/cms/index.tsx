import CMSService from "@/services/cms";
import { useState } from "react";
import { useEffect } from "react";

export function useGetAllServices({
  initalFetch = true,
}: {
  initalFetch?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<unknown | null>(null);

  const onCMSdata = async () => {
    setLoading(true);
    try {
      const res = await CMSService.getServices();
      setData(res.data.results);
    } catch (error) {
      console.error("Error fetching escalation levels:", error);
    } finally {
      setLoading(false);
    }
  };

  // Public refresh function
  const refresh = () => {
    onCMSdata();
  };

  useEffect(() => {
    if (initalFetch) onCMSdata();
  }, [initalFetch]);

  return { loading, data, refresh };
}

export function useEditServices() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<unknown | null>(null);

  const onCMSdata = async ({
    id,
    payload,
    successCallback,
    errorCallback,
  }: {
    id: string;
    payload: Record<string, unknown>;
    successCallback?: () => void;
    errorCallback?: () => void;
  }) => {
    setLoading(true);
    try {
      const res = await CMSService.updateService({ id, payload });
      setData(res.data.results);
      if (successCallback) successCallback();
    } catch (error) {
      console.error("Error updating service:", error);
      if (errorCallback) errorCallback();
    } finally {
      setLoading(false);
    }
  };

  return { loading, data, onCMSdata };
}
