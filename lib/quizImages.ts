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
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: ["images"] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ["images"] });

  if (result.canceled) return undefined;
  return result.assets[0];
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
