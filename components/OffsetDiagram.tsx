import Svg, { Line, Path, Polygon, Text as SvgText } from "react-native-svg";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

/**
 * Enkel principskiss för en offset: två motriktade 45°-bockar.
 * Röret fortsätter rakt men på en ny nivå.
 */
export function OffsetDiagram() {
  const theme = Colors[useColorScheme() ?? "light"];
  return (
    <Svg viewBox="0 0 360 140" width="100%" height={150}>
      {/* ursprunglig centrumlinje */}
      <Line
        x1="12"
        y1="100"
        x2="348"
        y2="100"
        stroke={theme.border}
        strokeWidth="1.5"
        strokeDasharray="5,4"
      />
      {/* röret: rakt – 45° upp – rakt – 45° ner – rakt */}
      <Path
        d="M12 100 H70 L130 40 H230 L290 100 H348"
        fill="none"
        stroke={theme.text}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* offset-pil */}
      <Line x1="312" y1="40" x2="312" y2="100" stroke={theme.accent} strokeWidth="2" />
      <Polygon points="307,47 317,47 312,39" fill={theme.accent} />
      <Polygon points="307,93 317,93 312,101" fill={theme.accent} />
      <SvgText x="320" y="74" fontSize="11" fill={theme.accent} fontWeight="bold">
        offset
      </SvgText>
      {/* bockmått */}
      <Line x1="130" y1="28" x2="230" y2="28" stroke={theme.muted} strokeWidth="1.2" />
      <SvgText x="180" y="20" fontSize="10" fill={theme.muted} textAnchor="middle">
        bockmått
      </SvgText>
      {/* 45° */}
      <SvgText x="88" y="66" fontSize="10" fill={theme.muted}>
        45°
      </SvgText>
      <SvgText x="246" y="66" fontSize="10" fill={theme.muted}>
        45°
      </SvgText>
      {/* nivåer */}
      <SvgText x="12" y="116" fontSize="9" fill={theme.muted}>
        ursprunglig nivå
      </SvgText>
      <SvgText x="270" y="34" fontSize="9" fill={theme.muted}>
        ny nivå
      </SvgText>
    </Svg>
  );
}
