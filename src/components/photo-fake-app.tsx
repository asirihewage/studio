
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import piexif from "piexifjs";
import {
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
  Trash2,
  BrainCircuit,
  ShieldOff,
  RefreshCcw,
  Pencil,
  Wand,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";

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
  phoneModel: z.string(),
  date: z.date().optional(),
  time: z.string().refine(val => val === '' || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), {
    message: "Please use HH:MM format or leave empty."
  }),
  latitude: z.union([z.coerce.number().min(-90).max(90), z.literal('')]),
  longitude: z.union([z.coerce.number().min(-180).max(180), z.literal('')]),
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
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
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

  const { watch, setValue, reset, getValues } = form;
  const watchedValues = watch();

  const populateFormFromExif = (exif: ExifData | null) => {
    if (!exif) {
      reset({
        phoneModel: "none",
        date: undefined,
        time: '',
        latitude: '',
        longitude: '',
      });
      return;
    };
    
    reset({
      phoneModel: exif.Model || "",
      date: exif.DateTimeOriginal ? new Date(exif.DateTimeOriginal.replace(/:/, '-').replace(/:/, '-')) : new Date(),
      time: exif.DateTimeOriginal ? format(new Date(exif.DateTimeOriginal.replace(/:/, '-').replace(/:/, '-')), "HH:mm") : format(new Date(), "HH:mm"),
      latitude: exif.GPSLatitude ? parseFloat(exif.GPSLatitude) : 40.7128,
      longitude: exif.GPSLongitude ? parseFloat(exif.GPSLongitude) : -74.006,
    });
  };

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
      setIsEditing(false); // Reset to preview mode on new file

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
            const dataUrl = e.target?.result as string;
            let exifDataToProcess = dataUrl;
            
            if (file.type !== 'image/jpeg') {
                setExistingExif(null);
                populateFormFromExif(null);
                return;
            }
            
            const exifData = piexif.load(exifDataToProcess);
            const zeroth = exifData['0th'] || {};
            const exif = exifData['Exif'] || {};
            const gps = exifData['GPS'] || {};

            const latRef = gps[piexif.GPSIFD.GPSLatitudeRef];
            const lat = gps[piexif.GPSIFD.GPSLatitude];
            const lonRef = gps[piexif.GPSIFD.GPSLongitudeRef];
            const lon = gps[piexif.GPSIFD.GPSLongitude];

            const latVal = lat && latRef ? piexif.GPSHelper.dmsToDeg(lat, latRef) : undefined;
            const lonVal = lon && lonRef ? piexif.GPSHelper.dmsToDeg(lon, lonRef) : undefined;

            const originalExif = {
                Make: zeroth[piexif.ImageIFD.Make] as string | undefined,
                Model: zeroth[piexif.ImageIFD.Model] as string | undefined,
                DateTimeOriginal: exif[piexif.ExifIFD.DateTimeOriginal] as string | undefined,
                CreateDate: exif[piexif.ExifIFD.CreateDate] as string | undefined,
                GPSLatitude: latVal?.toFixed(4),
                GPSLongitude: lonVal?.toFixed(4),
            };
            setExistingExif(originalExif);
            populateFormFromExif(originalExif);
          } catch (error) {
              setExistingExif(null);
              populateFormFromExif(null);
          }
      };
      reader.readAsDataURL(file);
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
    setIsEditing(false);
    reset({
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
  
  const handleBackToEdit = () => {
    if (modifiedImageSrc) {
        URL.revokeObjectURL(modifiedImageSrc);
    }
    setModifiedImageSrc(null);
  }
  
  const handleFetchLocation = () => {
    setIsFetchingLocation(true);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            setValue('latitude', parseFloat(position.coords.latitude.toFixed(4)));
            setValue('longitude', parseFloat(position.coords.longitude.toFixed(4)));
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

  const applyChanges = async (values: z.infer<typeof formSchema>) => {
    if (!imageFile || !imageSrc) return;
    setIsProcessing(true);

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
      
      const exifObj = piexif.load(imageDataUrl) || {};
      exifObj['0th'] = {};
      exifObj['Exif'] = {};
      exifObj['GPS'] = {};
      exifObj['1st'] = {};
      exifObj['thumbnail'] = null;

      exifObj["0th"][piexif.ImageIFD.Software] = "ExifLab";
      
      if (phoneModel && phoneModel !== 'none') {
          exifObj["0th"][piexif.ImageIFD.Make] = phoneModel.split(' ')[0];
          exifObj["0th"][piexif.ImageIFD.Model] = phoneModel;
      }

      if (date && time) {
          const [hours, minutes] = time.split(":").map(Number);
          const combinedDateTime = new Date(date);
          combinedDateTime.setHours(hours, minutes, 0, 0);
          const formattedDateTime = format(combinedDateTime, "yyyy:MM:dd HH:mm:ss");
          exifObj["Exif"][piexif.ExifIFD.DateTimeOriginal] = formattedDateTime;
          exifObj["Exif"][piexif.ExifIFD.CreateDate] = formattedDateTime;
      }
      
      if (latitude !== '' && longitude !== '') {
          exifObj["GPS"][piexif.GPSIFD.GPSLatitudeRef] = Number(latitude) >= 0 ? "N" : "S";
          exifObj["GPS"][piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDms(Math.abs(Number(latitude)));
          exifObj["GPS"][piexif.GPSIFD.GPSLongitudeRef] = Number(longitude) >= 0 ? "E" : "W";
          exifObj["GPS"][piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDms(Math.abs(Number(longitude)));
      }

      const exifStr = piexif.dump(exifObj);
      
      const cleanDataUrl = piexif.remove(imageDataUrl);
      const newImageData = piexif.insert(exifStr, cleanDataUrl);
      
      if(modifiedImageSrc) URL.revokeObjectURL(modifiedImageSrc);
      setModifiedImageSrc(newImageData);
      
      toast({
          title: "Success!",
          description: "Image metadata updated. You can now download the image.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: "Could not process the image.",
      });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDownloadImage = () => {
    if (!modifiedImageSrc || !imageFile) return;

    const link = document.createElement("a");
    link.href = modifiedImageSrc;

    const name = imageFile.name.substring(0, imageFile.name.lastIndexOf('.'));
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
  }, [imageSrc, modifiedImageSrc]);
  
  const handleRemovePrivacy = () => {
    setValue('latitude', '');
    setValue('longitude', '');
    setValue('date', undefined);
    setValue('time', '');
    toast({ title: 'Privacy fields cleared' });
    applyChanges(getValues());
  };
  
  const handleRemoveAi = () => {
    setValue('phoneModel', 'none');
    toast({ title: 'AI footprint fields cleared' });
    applyChanges(getValues());
  };
  
  const handleRemoveAll = () => {
    setValue('phoneModel', 'none');
    setValue('latitude', '');
    setValue('longitude', '');
    setValue('date', undefined);
    setValue('time', '');
    toast({ title: 'All metadata fields cleared' });
  };

  const handleReloadMetadata = () => {
    populateFormFromExif(existingExif);
    toast({ title: 'Original metadata reloaded into form' });
  };

  if (!imageSrc) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors h-full",
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
        </motion.div>
    );
  }

  return (
    <Card className="w-full max-w-4xl shadow-2xl bg-card/50 backdrop-blur-sm border-border/20 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
            <motion.div
                key={isEditing ? 'edit' : 'preview'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-grow flex flex-col"
            >
                <CardHeader className="flex-row items-start justify-between">
                    <div>
                        {/* No title or description here */}
                    </div>
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="sm" onClick={handleReset}>
                             <Trash2 className="mr-2 h-4 w-4" /> Start Over
                        </Button>
                        <Button onClick={handleDownloadImage} disabled={!modifiedImageSrc || isProcessing} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                             Download
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 grid md:grid-cols-2 gap-8 items-start flex-grow">
                    <div className="space-y-4 flex flex-col">
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                            <AnimatePresence>
                                {modifiedImageSrc && !isEditing && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="absolute inset-0 z-10"
                                    >
                                        <Image
                                            src={modifiedImageSrc}
                                            alt="Modified Preview"
                                            fill
                                            style={{ objectFit: "contain" }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <Image
                                src={imageSrc}
                                alt="Uploaded preview"
                                fill
                                style={{ objectFit: "contain" }}
                            />
                             {isProcessing && (
                                <div className="absolute inset-0 z-20 bg-background/80 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}
                        </div>

                        {!isEditing && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Metadata Diff</CardTitle>
                                        <CardDescription>
                                            Review original vs. proposed metadata changes.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="text-sm">
                                        {imageFile?.type !== 'image/jpeg' && (
                                            <p className="text-xs text-muted-foreground pb-2">Your file will be converted to JPEG to support EXIF data.</p>
                                        )}
                                        <DiffRow label="Make/Model" oldValue={`${existingExif?.Make || 'N/A'} ${existingExif?.Model || ''}`} newValue={watchedValues.phoneModel === 'none' ? 'Removed' : watchedValues.phoneModel || 'N/A'}/>
                                        <DiffRow label="Date/Time" oldValue={existingExif?.DateTimeOriginal} newValue={getNewDateTime()}/>
                                        <DiffRow label="Latitude" oldValue={existingExif?.GPSLatitude} newValue={String(watchedValues.latitude) || 'N/A'}/>
                                        <DiffRow label="Longitude" oldValue={existingExif?.GPSLongitude} newValue={String(watchedValues.longitude) || 'N/A'}/>
                                    </CardContent>
                                </Card>
                                <div className="space-y-2">
                                     <FormLabel>Quick Actions</FormLabel>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                         <Button type="button" variant="outline" size="sm" onClick={handleRemovePrivacy}><ShieldOff className="mr-2 h-3 w-3" /> Remove Privacy</Button>
                                         <Button type="button" variant="outline" size="sm" onClick={handleRemoveAi}><BrainCircuit className="mr-2 h-3 w-3" /> Remove AI Footprint</Button>
                                     </div>
                                </div>
                                <Button onClick={() => setIsEditing(true)} className="w-full bg-primary hover:bg-primary/90">
                                    <Pencil className="mr-2 h-4 w-4" /> Edit Myself
                                </Button>
                            </>
                        )}
                    </div>
                    
                    {isEditing && (
                        <div className="space-y-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(applyChanges)} className="space-y-6 flex flex-col">
                                    <div className="space-y-2">
                                        <FormLabel>Quick Actions</FormLabel>
                                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={handleReloadMetadata}><RefreshCcw className="mr-2 h-3 w-3" /> Reload Original</Button>
                                            <Button type="button" variant="destructive" size="sm" onClick={handleRemoveAll}><Trash2 className="mr-2 h-3 w-3" /> Clear All</Button>
                                        </div>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="phoneModel"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Smartphone className="h-4 w-4" />Phone Model</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isProcessing}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Select a device or leave empty" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None (Remove)</SelectItem>
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
                                            <FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" />Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isProcessing}>
                                                    {field.value ? (format(field.value, "PPP")) : (<span>Pick a date or leave empty</span>)}
                                                    </Button>
                                                </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus/>
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
                                            <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4" />Time</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="HH:MM or empty" disabled={isProcessing}/>
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <div className="flex justify-between items-center mb-2">
                                            <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" />Location</FormLabel>
                                            <Button type="button" variant="ghost" size="sm" onClick={handleFetchLocation} disabled={isFetchingLocation || isProcessing}>
                                                {isFetchingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LocateFixed className="mr-2 h-4 w-4" />}
                                                Use my location
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="latitude" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">Latitude</FormLabel>
                                                    <FormControl><Input type="number" step="0.0001" {...field} placeholder="e.g. 40.7128" disabled={isProcessing}/></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                            <FormField control={form.control} name="longitude" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">Longitude</FormLabel>
                                                    <FormControl><Input type="number" step="0.0001" {...field} placeholder="e.g. -74.006" disabled={isProcessing}/></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                        </div>
                                        <FormDescription className="mt-2">e.g., New York: 40.7128, -74.0060</FormDescription>
                                    </div>
                                    <CardFooter className="flex justify-end p-0 pt-4 gap-2">
                                        <Button onClick={() => setIsEditing(false)} variant="ghost">
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isProcessing}>
                                            <Wand className="mr-2 h-4 w-4" /> Apply Changes
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Form>
                        </div>
                    )}
                </CardContent>
            </motion.div>
        </AnimatePresence>
    </Card>
  );
}

    