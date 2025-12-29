"use server";

import { z } from "zod";
import { generateRealisticExifData } from "@/ai/flows/generate-realistic-exif-data";

const actionSchema = z.object({
  phoneModel: z.string().min(1, { message: "Phone model is required." }),
  dateTime: z.string().datetime({ message: "Invalid date and time." }),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export async function generateExifAction(values: unknown) {
  try {
    const validatedData = actionSchema.parse(values);
    
    const result = await generateRealisticExifData({
      phoneModel: validatedData.phoneModel,
      dateTime: validatedData.dateTime,
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
    });
    
    if (!result?.exifData) {
      return { success: false, error: "AI failed to generate EXIF data. The response was empty." };
    }

    return { success: true, data: result.exifData };
  } catch (error) {
    console.error("Error in generateExifAction:", error);
    if (error instanceof z.ZodError) {
        return { success: false, error: "Invalid input. Please check your form fields." };
    }
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
