// The wordmark. The "o" is the spectrum ring: the five rarity colors in order.
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`logo ${className}`} role="img" aria-label="Gotcha">
      <span aria-hidden>G</span>
      <span className="logo-o" aria-hidden />
      <span aria-hidden>tcha</span>
    </span>
  );
}
