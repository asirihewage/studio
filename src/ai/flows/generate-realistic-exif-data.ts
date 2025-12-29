'use server';
/**
 * @fileOverview Generates realistic EXIF data for an image based on provided parameters.
 *
 * - generateRealisticExifData - A function that generates realistic EXIF data.
 * - GenerateRealisticExifDataInput - The input type for the generateRealisticExifData function.
 * - GenerateRealisticExifDataOutput - The return type for the generateRealisticExifData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRealisticExifDataInputSchema = z.object({
  phoneModel: z.string().describe('The phone model used to take the photo.'),
  dateTime: z.string().describe('The date and time the photo was taken (ISO format).'),
  latitude: z.number().describe('The latitude where the photo was taken.'),
  longitude: z.number().describe('The longitude where the photo was taken.'),
});
export type GenerateRealisticExifDataInput = z.infer<typeof GenerateRealisticExifDataInputSchema>;

const GenerateRealisticExifDataOutputSchema = z.object({
  exifData: z.string().describe('Realistic EXIF data as a string.'),
});
export type GenerateRealisticExifDataOutput = z.infer<typeof GenerateRealisticExifDataOutputSchema>;

export async function generateRealisticExifData(input: GenerateRealisticExifDataInput): Promise<GenerateRealisticExifDataOutput> {
  return generateRealisticExifDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRealisticExifDataPrompt',
  input: {schema: GenerateRealisticExifDataInputSchema},
  output: {schema: GenerateRealisticExifDataOutputSchema},
  prompt: `You are an expert in creating realistic EXIF data for images.

  Given the following information, generate realistic EXIF data as a string that mimics the EXIF data of a photo taken with the specified phone model at the given time and location. The EXIF data should be complete and accurate, containing the parameters as defined below. Ensure consistency across fields to make the EXIF data appear authentic.

  Phone Model: {{{phoneModel}}}
  Date and Time: {{{dateTime}}}
  Latitude: {{{latitude}}}
  Longitude: {{{longitude}}}

  Return the EXIF data string. Include the following attributes, but generate realistic values according to the model:
  - Make
  - Model
  - DateTimeOriginal
  - GPSLatitude
  - GPSLongitude
  - GPSLatitudeRef
  - GPSLongitudeRef
  - ... other relevant EXIF attributes.
`,
});

const generateRealisticExifDataFlow = ai.defineFlow(
  {
    name: 'generateRealisticExifDataFlow',
    inputSchema: GenerateRealisticExifDataInputSchema,
    outputSchema: GenerateRealisticExifDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
