import { useId } from 'react';

/**
 * Subtle Islamic geometric octagon-lattice background pattern.
 * Renders an absolutely-positioned SVG overlay — parent must have
 * `position: relative` (or `absolute/fixed`) and a defined size.
 *
 * Props:
 *  opacity  – stroke opacity  (default 0.07)
 *  color    – explicit stroke color; if omitted, inherits `currentColor`
 *             (so Tailwind `text-*` classes on the SVG element apply)
 *  className – extra classes on the wrapper div
 */
const IslamicBg = ({ opacity = 0.07, color, className = '' }) => {
  const rawId = useId();
  // useId() can contain `:` which are invalid in SVG id attributes
  const pid = 'ip' + rawId.replace(/[^a-zA-Z0-9]/g, '');

  // When no explicit color is given, use currentColor + Tailwind text class
  const svgColorClass = color ? '' : 'text-brand-green-600 dark:text-brand-green-400';
  const stroke = color || 'currentColor';

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        className={`absolute inset-0 w-full h-full ${svgColorClass}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={pid}
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <g fill="none" stroke={stroke} strokeWidth="0.85" opacity={opacity}>
              {/* Central octagon — vertices at r=16 from centre (30,30) */}
              <polygon points="30,14 41,19 46,30 41,41 30,46 19,41 14,30 19,19" />

              {/* Lines connecting each octagon vertex to the tile edge/corner,
                  so adjacent tiles interlock seamlessly */}
              {/* top  */}
              <line x1="30" y1="0"  x2="30" y2="14" />
              {/* top-right */}
              <line x1="60" y1="0"  x2="41" y2="19" />
              {/* right */}
              <line x1="60" y1="30" x2="46" y2="30" />
              {/* bottom-right */}
              <line x1="60" y1="60" x2="41" y2="41" />
              {/* bottom */}
              <line x1="30" y1="60" x2="30" y2="46" />
              {/* bottom-left */}
              <line x1="0"  y1="60" x2="19" y2="41" />
              {/* left */}
              <line x1="0"  y1="30" x2="14" y2="30" />
              {/* top-left */}
              <line x1="0"  y1="0"  x2="19" y2="19" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pid})`} />
      </svg>
    </div>
  );
};

export default IslamicBg;
