import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

// Bucketen "quiz-images" är publik för LÄSNING (se 0002_quiz.sql) -- annars
// skulle anonyma QR-elever inte kunna visa quizbilderna utan en extra
// signerad-URL-runda. Bilderna är bara produktfoton av rördelar, ingen
// personinformation.
export function quizImageUrl(path: string): string {
  return supabase.storage.from("quiz-images").getPublicUrl(path).data.publicUrl;
}

// Ta ett nytt foto eller välj ur kamerarullen -- funkar på iPad, Android
// OCH webb (expo-image-picker faller tillbaka till en dold
// <input type="file"> i webbläsaren). Returnerar undefined om läraren
// avbryter valet.
export async function pickQuizImage(source: "camera" | "library"): Promise<ImagePicker.ImagePickerAsset | undefined> {
  const permission =
    source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      source === "camera" ? "Kameran behöver tillåtas för att ta ett foto." : "Bildbiblioteket behöver tillåtas för att välja en bild.",
    );
  }

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: ["images"], base64: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ["images"], base64: true });

  if (result.canceled) return undefined;
  return result.assets[0];
}

export type MaterialSuggestion = { name: string; wrongAnswers: string[] };

// Skickar den precis tagna/valda bilden till identify-material-funktionen,
// som frågar Claude vad rördelen heter. Kräver att asset.base64 finns (satt
// av base64:true ovan) -- funkar alltså bara för en NYSS vald bild, inte en
// redan uppladdad bild man bara har sökvägen till.
export async function suggestMaterialName(asset: ImagePicker.ImagePickerAsset): Promise<MaterialSuggestion> {
  if (!asset.base64) throw new Error("Bilden saknar data för AI-analys.");

  const { data, error } = await supabase.functions.invoke("identify-material", {
    body: { imageBase64: asset.base64, mimeType: asset.mimeType || "image/jpeg" },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return { name: data.name as string, wrongAnswers: (data.wrong_answers as string[]) ?? [] };
}

// Laddar upp en vald bild till lärarens egen org-mapp i Storage (RLS
// tillåter bara uppladdning under exakt den mappen, se 0002_quiz.sql).
// Returnerar den lagrade SÖKVÄGEN, inte en publik URL -- den byggs separat
// av quizImageUrl() när den faktiskt ska visas.
export async function uploadQuizImage(orgId: string, asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const rawExt = (asset.fileName?.split(".").pop() || asset.uri.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ext = rawExt || "jpg";
  const path = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from("quiz-images").upload(path, blob, {
    contentType: asset.mimeType || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;

  return path;
}
