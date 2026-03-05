import { useParams } from "next/navigation";

export const getSingleRouteParam = (
  params: ReturnType<typeof useParams>,
  key: string
): string | undefined => {
  const value =
    (params as Record<string, string | string[] | undefined>)?.[key];

  return Array.isArray(value) ? value[0] : value;
};
