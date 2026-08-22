export const publishedOpenSquaresAreAssignable = ({
  isPublished,
  openSquareCount,
  kickoffAt,
  now = Date.now(),
}: {
  isPublished: boolean;
  openSquareCount: number;
  kickoffAt?: string;
  now?: number;
}) => {
  const kickoffTime = kickoffAt ? Date.parse(kickoffAt) : Number.NaN;
  return Boolean(
    isPublished
    && openSquareCount > 0
    && Number.isFinite(kickoffTime)
    && now < kickoffTime
  );
};
