"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import piexif from "piexifjs";
import {
  Camera,
  ChevronLeft,
  CloudUpload,
  Download,
  Loader2,
  MapPin,
  Smartphone,
  Calendar as CalendarIcon,
  Clock,
  LocateFixed,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ANDROID_PHONE_MODELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

const formSchema = z.object({
  phoneModel: z.string().min(1, { message: "Please select a phone model." }),
  date: z.date({
    required_error: "A date is required.",
  }),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Please use HH:MM format."),
  latitude: z.coerce
    .number()
    .min(-90, "Must be between -90 and 90")
    .max(90, "Must be between -90 and 90"),
  longitude: z.coerce
    .number()
    .min(-180, "Must be between -180 and 180")
    .max(180, "Must be between -180 and 180"),
});

type ExifData = {
  Make?: string;
  Model?: string;
  DateTimeOriginal?: string;
  CreateDate?: string;
  GPSLatitude?: string;
  GPSLongitude?: string;
};

export function PhotoFakeApp() {
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [modifiedImageSrc, setModifiedImageSrc] = React.useState<string | null>(null);
  const [existingExif, setExistingExif] = React.useState<ExifData | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [isFetchingLocation, setIsFetchingLocation] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneModel: "",
      date: new Date(),
      time: format(new Date(), "HH:mm"),
      latitude: 40.7128,
      longitude: -74.006,
    },
  });

  const { watch } = form;
  const watchedValues = watch();

  const handleFileSelect = (file: File | null | undefined) => {
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/avif'].includes(file.type)) {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload a JPG/JPEG, PNG or AVIF file.',
        });
        return;
      }
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
      setImageFile(file);
      const newImageSrc = URL.createObjectURL(file);
      setImageSrc(newImageSrc);
      setModifiedImageSrc(null);

      if (file.type === 'image/jpeg') {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const exifData = piexif.load(e.target?.result as string);
                const gps = exifData['GPS'] || {};
                const lat = gps[piexif.Tag.GPS.GPSLatitude] ? piexif.GPSHelper.dmsToDeg(gps[piexif.Tag.GPS.GPSLatitude], gps[piexif.Tag.GPS.GPSLatitudeRef]) : undefined;
                const lon = gps[piexif.Tag.GPS.GPSLongitude] ? piexif.GPSHelper.dmsToDeg(gps[piexif.Tag.GPS.GPSLongitude], gps[piexif.Tag.GPS.GPSLongitudeRef]) : undefined;
                
                setExistingExif({
                    Make: exifData['0th'][piexif.Tag.Image.Make],
                    Model: exifData['0th'][piexif.Tag.Image.Model],
                    DateTimeOriginal: exifData['Exif'][piexif.Tag.Exif.DateTimeOriginal],
                    CreateDate: exifData['Exif'][piexif.Tag.Exif.CreateDate],
                    GPSLatitude: lat?.toFixed(4),
                    GPSLongitude: lon?.toFixed(4),
                });
            } catch (error) {
                setExistingExif({}); // No or invalid EXIF data
            }
        };
        reader.readAsDataURL(file);
      } else {
        setExistingExif(null); // PNG/AVIF don't have standard EXIF
      }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0]);
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelect(event.dataTransfer.files?.[0]);
  };

  const handleReset = () => {
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }
    if (modifiedImageSrc) {
        URL.revokeObjectURL(modifiedImageSrc);
    }
    setImageFile(null);
    setImageSrc(null);
    setModifiedImageSrc(null);
    setExistingExif(null);
    form.reset({
      phoneModel: "",
      date: new Date(),
      time: format(new Date(), "HH:mm"),
      latitude: 40.7128,
      longitude: -74.006,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleBackToForm = () => {
    if (modifiedImageSrc) {
        URL.revokeObjectURL(modifiedImageSrc);
    }
    setModifiedImageSrc(null);
  }
  
  const handleFetchLocation = () => {
    setIsFetchingLocation(true);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            form.setValue('latitude', parseFloat(position.coords.latitude.toFixed(4)));
            form.setValue('longitude', parseFloat(position.coords.longitude.toFixed(4)));
            toast({
                title: "Location Updated",
                description: "Your current location has been set.",
            });
            setIsFetchingLocation(false);
        }, (error) => {
            toast({
                variant: 'destructive',
                title: "Location Error",
                description: "Could not fetch location. Please enable location services.",
            });
            setIsFetchingLocation(false);
        });
    } else {
        toast({
            variant: 'destructive',
            title: "Geolocation Not Supported",
            description: "Your browser does not support geolocation.",
        });
        setIsFetchingLocation(false);
    }
  };

  const convertToJpegDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg'));
          } else {
            reject(new Error("Could not get canvas context"));
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!imageFile || !imageSrc) {
      toast({
        variant: "destructive",
        title: "No Image",
        description: "Please upload an image first.",
      });
      return;
    }
    
    startTransition(async () => {
      try {
        let imageDataUrl: string;
        if (imageFile.type === 'image/jpeg') {
          imageDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });
        } else {
          imageDataUrl = await convertToJpegDataUrl(imageFile);
        }
            
        const { phoneModel, date, time, latitude, longitude } = values;
        const [hours, minutes] = time.split(":").map(Number);
        const combinedDateTime = new Date(date);
        combinedDateTime.setHours(hours, minutes, 0, 0);

        const formattedDateTime = format(combinedDateTime, "yyyy:MM:dd HH:mm:ss");

        const exifObj = { "0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": null };

        exifObj["0th"][piexif.Tag.Image.Make] = phoneModel.split(' ')[0];
        exifObj["0th"][piexif.Tag.Image.Model] = phoneModel;
        exifObj["0th"][piexif.Tag.Image.Software] = "ExifLab";
        
        exifObj["Exif"][piexif.Tag.Exif.DateTimeOriginal] = formattedDateTime;
        exifObj["Exif"][piexif.Tag.Exif.CreateDate] = formattedDateTime;
        
        exifObj["GPS"][piexif.Tag.GPS.GPSLatitudeRef] = latitude >= 0 ? "N" : "S";
        exifObj["GPS"][piexif.Tag.GPS.GPSLatitude] = piexif.GPSHelper.degToDms(Math.abs(latitude));
        exifObj["GPS"][piexif.Tag.GPS.GPSLongitudeRef] = longitude >= 0 ? "E" : "W";
        exifObj["GPS"][piexif.Tag.GPS.GPSLongitude] = piexif.GPSHelper.degToDms(Math.abs(longitude));

        const exifStr = piexif.dump(exifObj);
        
        const cleanDataUrl = piexif.remove(imageDataUrl);
        const newImageData = piexif.insert(exifStr, cleanDataUrl);
        
        setModifiedImageSrc(newImageData);
        
        toast({
            title: "Success!",
            description: "Image metadata has been updated. You can now download the image.",
        });
      } catch (error) {
        console.error("Error processing image:", error);
        toast({
          variant: "destructive",
          title: "Processing Error",
          description: "Could not process the image. It might be corrupted or in an unsupported format.",
        });
      }
    });
  };

  const handleDownloadImage = () => {
    if (!modifiedImageSrc || !imageFile) return;

    const link = document.createElement("a");
    link.href = modifiedImageSrc;

    const name = imageFile.name.substring(0, imageFile.name.lastIndexOf('.'));
    // The downloaded file will be a jpeg
    link.download = `${name}_exiflab.jpeg`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getNewDateTime = () => {
    const { date, time } = watchedValues;
    if (!date || !time) return "N/A";
    const [hours, minutes] = time.split(":").map(Number);
    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(hours, minutes, 0, 0);
    return format(combinedDateTime, "yyyy:MM:dd HH:mm:ss");
  };

  const DiffRow = ({ label, oldValue, newValue }: {label:string, oldValue?: string, newValue?: string}) => (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
        <span className="font-medium text-sm">{label}</span>
        <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground line-clamp-1 break-all max-w-[120px]">{oldValue || 'N/A'}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-semibold line-clamp-1 break-all max-w-[120px]">{newValue || 'N/A'}</span>
        </div>
    </div>
  )
  
  React.useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      if (modifiedImageSrc) URL.revokeObjectURL(modifiedImageSrc);
    };
  }, []);


  return (
    <Card className="w-full max-w-4xl shadow-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
                <Camera className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
                <CardTitle className="text-2xl font-headline">ExifLab</CardTitle>
                <CardDescription>
                Generate realistic EXIF data for your images.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {!imageSrc && (
          <div
            className={cn(
                "flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors",
                isDragging && "bg-primary/10 border-primary"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CloudUpload className={cn("h-12 w-12 text-muted-foreground/70 mb-4 transition-transform", isDragging && "scale-110")} />
            <p className="font-semibold text-foreground">
              Click to upload or drag & drop
            </p>
            <p className="text-sm text-muted-foreground">
              JPG/JPEG, PNG, or AVIF files
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/jpeg,image/png,image/avif"
            />
          </div>
        )}
        
        {imageSrc && modifiedImageSrc && (
            <div className="space-y-6">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                    <Image
                        src={modifiedImageSrc}
                        alt="Modified preview"
                        fill
                        style={{objectFit:"contain"}}
                    />
                </div>
                 <CardFooter className="flex justify-between p-0 pt-6">
                    <Button variant="outline" onClick={handleBackToForm}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Edit
                    </Button>
                    <Button onClick={handleDownloadImage} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Download className="mr-2 h-4 w-4" /> Download Image
                    </Button>
                </CardFooter>
            </div>
        )}

        {imageSrc && !modifiedImageSrc && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                <Image
                    src={imageSrc}
                    alt="Uploaded preview"
                    fill
                    style={{objectFit:"contain"}}
                />
                </div>
                {imageFile?.type === 'image/jpeg' && existingExif && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Metadata Diff</CardTitle>
                            <CardDescription>Original vs. New EXIF data.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <DiffRow label="Make/Model" oldValue={`${existingExif.Make || ''} ${existingExif.Model || ''}`} newValue={watchedValues.phoneModel}/>
                            <DiffRow label="Date/Time" oldValue={existingExif.DateTimeOriginal} newValue={getNewDateTime()}/>
                            <DiffRow label="Latitude" oldValue={existingExif.GPSLatitude} newValue={String(watchedValues.latitude)}/>
                            <DiffRow label="Longitude" oldValue={existingExif.GPSLongitude} newValue={String(watchedValues.longitude)}/>
                        </CardContent>
                    </Card>
                )}
                 {imageFile?.type !== 'image/jpeg' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Metadata</CardTitle>
                             <CardDescription>New EXIF data to be added.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p className="text-xs text-muted-foreground pb-2">Your file will be converted to JPEG to support EXIF data.</p>
                            <DiffRow label="Make/Model" oldValue="N/A" newValue={watchedValues.phoneModel}/>
                            <DiffRow label="Date/Time" oldValue="N/A" newValue={getNewDateTime()}/>
                            <DiffRow label="Latitude" oldValue="N/A" newValue={String(watchedValues.latitude)}/>
                            <DiffRow label="Longitude" oldValue="N/A" newValue={String(watchedValues.longitude)}/>
                        </CardContent>
                    </Card>
                 )}
            </div>
            <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex flex-col h-full">
                <div className="grid grid-cols-1 gap-6 flex-grow">
                  <FormField
                    control={form.control}
                    name="phoneModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Smartphone />Phone Model</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an Android phone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ANDROID_PHONE_MODELS.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                     <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                           <FormLabel className="flex items-center gap-2"><CalendarIcon />Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={isPending}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Clock />Time</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="HH:MM" disabled={isPending}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1">
                     <div className="flex justify-between items-center mb-2">
                        <FormLabel className="flex items-center gap-2"><MapPin />Location</FormLabel>
                        <Button type="button" variant="ghost" size="sm" onClick={handleFetchLocation} disabled={isFetchingLocation || isPending}>
                            {isFetchingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LocateFixed className="mr-2 h-4 w-4" />}
                            Use my location
                        </Button>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">Latitude</FormLabel>
                                <FormControl>
                                <Input type="number" step="0.0001" {...field} disabled={isPending}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="longitude"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">Longitude</FormLabel>
                                <FormControl>
                                <Input type="number" step="0.0001" {...field} disabled={isPending}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                     </div>
                     <FormDescription className="mt-2">
                        e.g., New York: 40.7128, -74.0060
                    </FormDescription>
                  </div>
                </div>
                 <CardFooter className="flex justify-between p-0 pt-8 mt-auto">
                    <Button type="button" variant="ghost" onClick={handleReset} disabled={isPending}>
                    Reset
                    </Button>
                    <Button type="submit" disabled={isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Apply Changes
                    </Button>
                </CardFooter>
              </form>
            </Form>
          </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
