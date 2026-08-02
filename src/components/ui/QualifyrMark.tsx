type QualifyrMarkProps = {
  className?: string | undefined;
};

/** Nouveau monogramme Q fourni par Dorian, en aplat contextuel. */
export function QualifyrMark({ className }: QualifyrMarkProps) {
  return (
    <svg
      viewBox="0 0 303 316"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...(className ? { className } : {})}
    >
      <mask id="qualifyr-mark-alpha">
        <image href="/images/brand/qualifyr-mark.png" width="303" height="316" />
      </mask>
      <rect width="303" height="316" mask="url(#qualifyr-mark-alpha)" />
    </svg>
  );
}
