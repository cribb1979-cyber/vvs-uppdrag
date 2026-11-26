import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { bockSkissProportion, bockSkissSvg } from "@/lib/bockSkisser";
import type { SkissId } from "@/lib/skisser";

/**
 * Principskiss för systemövningen "Värmesystem på tavla".
 * Ritad som ren SVG så att den skalar i både mobil och webb.
 */
export const SYSTEM_SKISS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420">
  <rect width="600" height="420" fill="#f7f9fc"/>
  <rect x="8" y="8" width="584" height="404" rx="12" fill="none" stroke="#c8d2df" stroke-width="2" stroke-dasharray="9 7"/>

  <text x="26" y="36" font-family="DejaVu Sans" font-size="15" font-weight="bold" fill="#16324f">PRINCIPSKISS – VÄRMESYSTEM PÅ TAVLA</text>
  <text x="26" y="54" font-family="DejaVu Sans" font-size="10" fill="#5b6b80">panna 110 · öppet kärl 75 · fram och retur 15 · radiatorer 12 · cirkulationspump</text>

  <!-- öppet kärl -->
  <path d="M64,250 L64,110 M112,110 L112,250 Q88,258 64,250" fill="none" stroke="#16324f" stroke-width="2.6"/>
  <path d="M64,132 L112,132" stroke="#8aa2bd" stroke-width="1.6" stroke-dasharray="4 4"/>
  <text x="60" y="102" font-family="DejaVu Sans" font-size="11" font-weight="bold" fill="#16324f">ÖPPET KÄRL 75 × 250</text>
  <text x="118" y="128" font-family="DejaVu Sans" font-size="9" fill="#7d8ba1">vattenyta</text>

  <!-- kärlet ansluter till framledningens högsta punkt -->
  <path d="M112,240 L140,240" fill="none" stroke="#16324f" stroke-width="2.2"/>

  <!-- framledning -->
  <path d="M140,330 L140,150 L430,150" fill="none" stroke="#16324f" stroke-width="2.2"/>
  <!-- returledning -->
  <path d="M430,300 L358,300 M322,300 L300,300 L300,330" fill="none" stroke="#16324f" stroke-width="2.2"/>

  <!-- panna -->
  <rect x="100" y="330" width="260" height="56" rx="26" fill="none" stroke="#16324f" stroke-width="2.6"/>
  <text x="230" y="406" font-family="DejaVu Sans" font-size="12" font-weight="bold" text-anchor="middle" fill="#16324f">PANNA 110 × 500</text>

  <!-- radiatorer -->
  <path d="M430,150 V180 H462 V210 H430 V240 H462 V270 H430 V300" fill="none" stroke="#16324f" stroke-width="2.2"/>
  <path d="M530,150 V180 H562 V210 H530 V240 H562 V270 H530 V300" fill="none" stroke="#16324f" stroke-width="2.2"/>
  <path d="M430,150 L530,150" fill="none" stroke="#16324f" stroke-width="2.2"/>
  <path d="M430,300 L530,300" fill="none" stroke="#16324f" stroke-width="2.2"/>
  <text x="496" y="140" font-family="DejaVu Sans" font-size="11" font-weight="bold" text-anchor="middle" fill="#16324f">RADIATORER 12 MM</text>

  <!-- pump -->
  <circle cx="340" cy="300" r="18" fill="#fff" stroke="#16324f" stroke-width="2.6"/>
  <path d="M347,291 L331,300 L347,309 Z" fill="#16324f"/>
  <text x="340" y="270" font-family="DejaVu Sans" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#16324f">CIRKULATIONSPUMP</text>

  <!-- flödespilar -->
  <path d="M134,262 L146,262 L140,250 Z" fill="#e0a63c"/>
  <path d="M300,144 L300,156 L312,150 Z" fill="#e0a63c"/>
  <path d="M400,294 L400,306 L388,300 Z" fill="#e0a63c"/>
  <path d="M486,144 L486,156 L498,150 Z" fill="#e0a63c"/>

  <text x="150" y="282" font-family="DejaVu Sans" font-size="10" font-weight="bold" fill="#b8801f">FRAM</text>
  <text x="372" y="292" font-family="DejaVu Sans" font-size="10" font-weight="bold" fill="#b8801f">RETUR</text>

  <!-- infästning -->
  <path d="M98,286 L126,330" stroke="#7d8ba1" stroke-width="1.4" stroke-dasharray="4 4"/>
  <text x="24" y="276" font-family="DejaVu Sans" font-size="10" fill="#43566d">GÄNGSTÅNG M8</text>
  <text x="24" y="289" font-family="DejaVu Sans" font-size="10" fill="#43566d">+ SVEPKLAMMER</text>

  <text x="588" y="404" font-family="DejaVu Sans" font-size="9.5" fill="#43566d" text-anchor="end">Z-JÄRN OCH L-JÄRN STAGAR TAVLAN</text>
</svg>`;

function skissSvg(id: SkissId): string {
  return id === "system-cirkulation" ? SYSTEM_SKISS : bockSkissSvg(id);
}

/** Bredd/höjd – så att skissen får rätt proportioner i en ruta. */
export function skissProportion(id: SkissId): number {
  return id === "system-cirkulation" ? 600 / 420 : bockSkissProportion(id);
}

export function SystemSkiss({ id = "system-cirkulation" }: { id?: SkissId }) {
  return <SvgXml xml={skissSvg(id)} width="100%" height="100%" />;
}

/** Skissen i helskärm. På en telefon blir den bredare än skärmen, så man
    kan dra i sidled och läsa måtten. */
function SkissZoom({ id, onClose }: { id: SkissId; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const bredd = width < 700 ? Math.max(width * 1.8, 640) : Math.min(width - 32, 1200);
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(10,20,35,0.92)", paddingTop: 48 }}>
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Stäng skissen"
          style={{ position: "absolute", top: 10, right: 16, padding: 8, zIndex: 2 }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>✕ Stäng</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={{ minHeight: height - 48, justifyContent: "center" }}>
          <ScrollView horizontal contentContainerStyle={{ padding: 16 }}>
            <View style={{ width: bredd, aspectRatio: skissProportion(id), backgroundColor: "#f7f9fc", borderRadius: 8, overflow: "hidden" }}>
              <SystemSkiss id={id} />
            </View>
          </ScrollView>
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Skiss med rätt proportioner. Tryck för att förstora. */
export function SkissMedZoom({ id, style }: { id: SkissId; style?: StyleProp<ViewStyle> }) {
  const [stor, setStor] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setStor(true)} accessibilityRole="imagebutton" accessibilityLabel="Förstora skissen">
        <View style={[{ width: "100%", aspectRatio: skissProportion(id), backgroundColor: "#f7f9fc", borderRadius: 10, overflow: "hidden" }, style]}>
          <SystemSkiss id={id} />
        </View>
      </TouchableOpacity>
      {stor && <SkissZoom id={id} onClose={() => setStor(false)} />}
    </>
  );
}

/** Skissen i en ruta med samma mått som en referensbild. Tryck för att förstora. */
export function SkissRuta({ id, style }: { id: SkissId | null; style?: StyleProp<ViewStyle> }) {
  const [stor, setStor] = useState(false);
  if (!id) return null;
  return (
    <>
      <TouchableOpacity onPress={() => setStor(true)} accessibilityRole="imagebutton" accessibilityLabel="Förstora skissen">
        <View style={[{ backgroundColor: "#f7f9fc", borderRadius: 12, overflow: "hidden" }, style]}>
          <SystemSkiss id={id} />
        </View>
      </TouchableOpacity>
      {stor && <SkissZoom id={id} onClose={() => setStor(false)} />}
    </>
  );
}
