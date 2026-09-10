"use client";

/**
 * Renders text along an arc, following the curve of a dome-topped image.
 * `radius`/`viewBoxSize` should roughly match the container the text sits
 * over so the curvature lines up with the image's rounded top edge.
 */
export function CurvedText({
  text,
  className,
  viewBoxSize = 400,
  radius = 180,
  startAngle = 200,
  endAngle = -20,
}: {
  text: string;
  className?: string;
  viewBoxSize?: number;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
}) {
  const id = "curved-text-path";
  const cx = viewBoxSize / 2;
  const cy = viewBoxSize / 2;

  const toXY = (angleDeg: number) => {
    const angle = (angleDeg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy - radius * Math.sin(angle),
    };
  };

  const start = toXY(startAngle);
  const end = toXY(endAngle);
  const largeArcFlag = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;

  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      className={className}
      aria-hidden={false}
    >
      <path
        id={id}
        d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`}
        fill="none"
      />
      <text className="font-marcellus" fill="white" fontSize="18" letterSpacing="0.5">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  );
}