type RouteParams = Record<string, string | string[] | undefined>;

export const getSingleRouteParam = (
  params: RouteParams,
  key: string
): string | undefined => {
  const value = params?.[key];

  return Array.isArray(value) ? value[0] : value;
};
