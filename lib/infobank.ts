import * as Crypto from "expo-crypto";
import type * as ImagePicker from "expo-image-picker";
import { APP_URL } from "./links";
import { supabase } from "./supabase";

export interface Installation {
  id: string;
  org_id: string;
  created_by: string;
  token: string;
  titel: string;
  plats: string;
  funktion: string;
  driftsattning: string[];
  foto_path: string | null;
  schema_path: string | null;
  publicerad: boolean;
  visas_fran: string | null;
  visas_till: string | null;
  created_at: string;
  updated_at: string;
}

/** Slumpad token. Aldrig löpnummer – då kan ingen gissa sig till en annan
    installations adress. 16 hextecken = 64 bitar. */
export function nyToken(): string {
  return Crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

/** Publik adress som QR-koden kodar. Basadressen kommer från lib/links. */
export function publikUrl(token: string): string {
  return `${APP_URL}/i/${token}`;
}

export const TOM_INSTALLATION = {
  titel: "",
  plats: "",
  funktion: "",
  driftsattning: [] as string[],
  foto_path: null as string | null,
  schema_path: null as string | null,
  publicerad: false,
  visas_fran: null as string | null,
  visas_till: null as string | null,
};

/** Laddar upp en bild till den publika bucketen. Sökvägen börjar med
    org-id:t, så lagringspolicyn kan kontrollera ägarskapet. */
export async function laddaUppBild(orgId: string, asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const rawExt = (asset.fileName?.split(".").pop() || asset.uri.split(".").pop() || "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const ext = rawExt || "jpg";
  const path = `${orgId}/${Crypto.randomUUID()}.${ext}`;
  const blob = await (await fetch(asset.uri)).blob();
  const { error } = await supabase.storage.from("installationer").upload(path, blob, {
    contentType: asset.mimeType || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export function bildUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from("installationer").getPublicUrl(path).data.publicUrl;
}

export function datumOk(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}
