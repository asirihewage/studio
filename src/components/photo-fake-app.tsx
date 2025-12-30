
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
  Camera,
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
import { DEVICE_PROFILES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

const formSchema = z.object({
  deviceModel: z.string(),
  date: z.date().optional(),
  time: z.string().refine(val => val === '' || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), {
    message: "Please use HH:MM format or leave empty."
  }),
  latitude: z.union([z.coerce.number().min(-90).max(90), z.literal('')]),
  longitude: z.union([z.coerce.number().min(-180).max(180), z.literal('')]),
});

type ExifData = { [key: string]: { [key: number]: any } };

const ALL_TAGS: { [key: string]: { [key: number]: string } } = {};
if (piexif && piexif.TAGS) {
    Object.keys(piexif.TAGS).forEach(ifd => {
        ALL_TAGS[ifd] = {};
        Object.keys(piexif.TAGS[ifd]).forEach(tagId => {
            ALL_TAGS[ifd][parseInt(tagId)] = piexif.TAGS[ifd][tagId].name;
        });
    });
}

const formatExifValue = (ifd: string, tag: string, value: any): string => {
    if (value === undefined || value === null) return 'N/A';
  
    if (ifd === 'GPS' && Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
      return value.map((dms: [number, number]) => `${(dms[0]/dms[1]).toFixed(2)}`).join(', ');
    }
    
    if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number' && value[1] !== 0) {
        if (tag === 'ExposureTime' && value[0] === 1) return `1/${value[1]}`;
        return `f/${(value[0] / value[1]).toFixed(1)}`;
    }

    if (typeof value === 'string') {
        return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, "");
    }
  
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return '[Circular Object]';
        }
    }

    return String(value);
};


export function PhotoFakeApp({ onFileSelect }: { onFileSelect: (file: File | null) => void }) {
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
      deviceModel: "none",
      date: undefined,
      time: "",
      latitude: '',
      longitude: '',
    },
  });

  const { watch, setValue, reset, getValues } = form;
  const watchedValues = watch();

  const populateFormFromExif = (exif: ExifData | null) => {
    if (!exif) {
      reset({
        deviceModel: "none",
        date: undefined,
        time: '',
        latitude: '',
        longitude: '',
      });
      return;
    };
    
    const zeroth = exif['0th'] || {};
    const gps = exif['GPS'] || {};
    const exifIfd = exif['Exif'] || {};
    const model = zeroth[piexif.ImageIFD.Model] as string | undefined;
    const dateTime = exifIfd[piexif.ExifIFD.DateTimeOriginal] as string | undefined;
    
    const latRef = gps[piexif.GPSIFD.GPSLatitudeRef];
    const lat = gps[piexif.GPSIFD.GPSLatitude];
    const lonRef = gps[piexif.GPSIFD.GPSLongitudeRef];
    const lon = gps[piexif.GPSIFD.GPSLongitude];

    let latVal: number | '' = '';
    let lonVal: number | '' = '';
    
    const GPSHelper = (piexif as any).GPSHelper;
    try {
        if (GPSHelper && lat && latRef) {
            latVal = parseFloat(GPSHelper.dmsToDeg(lat, latRef).toFixed(4));
        }
        if (GPSHelper && lon && lonRef) {
            lonVal = parseFloat(GPSHelper.dmsToDeg(lon, lonRef).toFixed(4));
        }
    } catch(e) {
        console.error("Could not parse GPS coordinates from EXIF", e)
    }

    let dateVal: Date | undefined = undefined;
    let timeVal: string = '';
    if (dateTime) {
        try {
            const parsedDate = new Date(dateTime.replace(/:/, '-').replace(/:/, '-'));
            if (!isNaN(parsedDate.getTime())) {
                dateVal = parsedDate;
                timeVal = format(parsedDate, "HH:mm");
            }
        } catch (e) {
            console.error("Could not parse date from EXIF", e);
        }
    }
    
    reset({
      deviceModel: model || "none",
      date: dateVal,
      time: timeVal,
      latitude: latVal,
      longitude: lonVal,
    });
  };

  const handleFileSelectInternal = (file: File | null | undefined) => {
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
      onFileSelect(file);
      const newImageSrc = URL.createObjectURL(file);
      setImageSrc(newImageSrc);
      setModifiedImageSrc(null);
      setIsEditing(false); // Reset to preview mode on new file

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
            const dataUrl = e.target?.result as string;
            
            if (file.type !== 'image/jpeg') {
                setExistingExif(null);
                populateFormFromExif(null);
                return;
            }
            
            const exifData = piexif.load(dataUrl);
            setExistingExif(exifData);
            populateFormFromExif(exifData);
          } catch (error) {
              setExistingExif(null);
              populateFormFromExif(null);
          }
      };
      reader.readAsDataURL(file);
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelectInternal(event.target.files?.[0]);
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
    handleFileSelectInternal(event.dataTransfer.files?.[0]);
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
    onFileSelect(null);
    setModifiedImageSrc(null);
    setExistingExif(null);
    setIsEditing(false);
    reset({
      deviceModel: "none",
      date: new Date(),
      time: format(new Date(), "HH:mm"),
      latitude: '',
      longitude: '',
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
    
    const GPSHelper = (piexif as any).GPSHelper;

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
          
      const { deviceModel, date, time, latitude, longitude } = values;
      
      const exifObj = piexif.load(imageDataUrl) || {};
      exifObj['0th'] = exifObj['0th'] || {};
      exifObj['Exif'] = exifObj['Exif'] || {};
      exifObj['GPS'] = {}; // Always clear GPS to start fresh
      exifObj['1st'] = exifObj['1st'] || {};
      exifObj['thumbnail'] = exifObj['thumbnail'] || null;

      exifObj["0th"][piexif.ImageIFD.Software] = "ExifLab";
      
      if (deviceModel && deviceModel !== 'none') {
        const profile = DEVICE_PROFILES[deviceModel];
        if (profile) {
            exifObj["0th"][piexif.ImageIFD.Make] = profile.make;
            exifObj["0th"][piexif.ImageIFD.Model] = profile.model;
            if (profile.software) {
                exifObj["0th"][piexif.ImageIFD.Software] = profile.software;
            }
            if (profile.exif.FNumber) exifObj["Exif"][piexif.ExifIFD.FNumber] = profile.exif.FNumber;
            if (profile.exif.ExposureTime) exifObj["Exif"][piexif.ExifIFD.ExposureTime] = profile.exif.ExposureTime;
            if (profile.exif.ISOSpeedRatings) exifObj["Exif"][piexif.ExifIFD.ISOSpeedRatings] = profile.exif.ISOSpeedRatings;
            if (profile.exif.FocalLength) exifObj["Exif"][piexif.ExifIFD.FocalLength] = profile.exif.FocalLength;
            if (profile.exif.LensModel) exifObj["Exif"][piexif.ExifIFD.LensModel] = profile.exif.LensModel;
        }
      } else {
        delete exifObj["0th"][piexif.ImageIFD.Make];
        delete exifObj["0th"][piexif.ImageIFD.Model];
      }

      if (date && time) {
          const [hours, minutes] = time.split(":").map(Number);
          const combinedDateTime = new Date(date);
          combinedDateTime.setHours(hours, minutes, 0, 0);
          const formattedDateTime = format(combinedDateTime, "yyyy:MM:dd HH:mm:ss");
          exifObj["Exif"][piexif.ExifIFD.DateTimeOriginal] = formattedDateTime;
          exifObj["Exif"][piexif.ExifIFD.CreateDate] = formattedDateTime;
      } else {
        delete exifObj["Exif"][piexif.ExifIFD.DateTimeOriginal];
        delete exifObj["Exif"][piexif.ExifIFD.CreateDate];
      }
      
      if (latitude !== '' && longitude !== '' && GPSHelper) {
          try {
            exifObj["GPS"][piexif.GPSIFD.GPSLatitudeRef] = Number(latitude) >= 0 ? "N" : "S";
            exifObj["GPS"][piexif.GPSIFD.GPSLatitude] = GPSHelper.degToDms(Math.abs(Number(latitude)));
            exifObj["GPS"][piexif.GPSIFD.GPSLongitudeRef] = Number(longitude) >= 0 ? "E" : "W";
            exifObj["GPS"][piexif.GPSIFD.GPSLongitude] = GPSHelper.degToDms(Math.abs(Number(longitude)));
          } catch (e) {
            console.error("Error converting GPS coordinates:", e)
             toast({
                variant: "destructive",
                title: "GPS Error",
                description: "Could not process GPS coordinates. They may be invalid.",
             });
          }
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
  
  const DiffRow = ({ label, oldValue, newValue }: {label:string, oldValue?: string | null, newValue?: string | null}) => {
    const displayOld = oldValue || 'N/A';
    const displayNew = newValue || 'N/A';
    if (displayOld === displayNew) return null;

    return (
        <div className="flex items-center justify-between py-2 border-b last:border-b-0 text-sm">
            <span className="font-medium text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2 text-right">
                <span className="text-foreground font-semibold line-clamp-1 break-all max-w-[150px]">{displayNew}</span>
            </div>
        </div>
    )
  }

  const ChangesSummary = () => {
    const { deviceModel, date, time, latitude, longitude } = watchedValues;
    const oldExif = existingExif || { '0th': {}, Exif: {}, GPS: {} };
    const oldModel = oldExif['0th']?.[piexif.ImageIFD.Model] || 'N/A';
    const oldDateTime = oldExif['Exif']?.[piexif.ExifIFD.DateTimeOriginal] || 'N/A';
    
    const GPSHelper = (piexif as any).GPSHelper;
    let oldLat = 'N/A';
    let oldLon = 'N/A';
    if (GPSHelper && oldExif.GPS) {
        const latRef = oldExif['GPS']?.[piexif.GPSIFD.GPSLatitudeRef];
        const lat = oldExif['GPS']?.[piexif.GPSIFD.GPSLatitude];
        const lonRef = oldExif['GPS']?.[piexif.GPSIFD.GPSLongitudeRef];
        const lon = oldExif['GPS']?.[piexif.GPSIFD.GPSLongitude];
        if (lat && latRef) oldLat = GPSHelper.dmsToDeg(lat, latRef).toFixed(4);
        if (lon && lonRef) oldLon = GPSHelper.dmsToDeg(lon, lonRef).toFixed(4);
    }
    const oldLocation = (oldLat !== 'N/A' && oldLon !== 'N/A') ? `${oldLat}, ${oldLon}` : 'N/A';

    const newModel = deviceModel !== 'none' ? deviceModel : "REMOVED";
    
    let newDateTime = "N/A";
    if (date && time) {
        const [hours, minutes] = time.split(":").map(Number);
        const combinedDateTime = new Date(date);
        combinedDateTime.setHours(hours, minutes, 0, 0);
        newDateTime = format(combinedDateTime, "yyyy:MM:dd HH:mm:ss");
    } else if (!date && !time) {
        newDateTime = "REMOVED";
    }

    const newLocation = (latitude !== '' && longitude !== '') ? `${latitude}, ${longitude}` : 'REMOVED';

    const hasChanges = newModel !== oldModel || newDateTime !== oldDateTime || newLocation !== oldLocation;

    if (!hasChanges) {
        return (
            <div className="p-3 text-center text-sm text-muted-foreground border rounded-lg">
                <p>Make a change to see a summary here.</p>
            </div>
        )
    }

    return (
        <Card className="bg-background/50">
            <CardHeader className="p-4">
                <CardTitle className="text-base">Changes Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <DiffRow label="Device Model" oldValue={oldModel} newValue={newModel} />
                <DiffRow label="Date/Time" oldValue={oldDateTime} newValue={newDateTime} />
                <DiffRow label="Location" oldValue={oldLocation} newValue={newLocation} />
            </CardContent>
        </Card>
    );
  };
  
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
  };
  
  const handleRemoveAi = () => {
    setValue('deviceModel', 'none');
    toast({ title: 'AI footprint fields cleared' });
  };
  
  const handleRemoveAll = () => {
    setValue('deviceModel', 'none');
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
  
  const renderExifData = () => {
    if (!existingExif) {
      return <p className="text-sm text-muted-foreground p-4">No EXIF data found in this image.</p>;
    }
    const ifdOrder = ['0th', 'Exif', 'GPS', '1st'];
    
    return (
        <ScrollArea className="h-full w-full rounded-md border p-4">
            <div className="space-y-4">
            {ifdOrder.map(ifdName => {
                const ifdData = existingExif[ifdName];
                if (!ifdData || Object.keys(ifdData).length === 0) return null;

                const tagNames: { [key: number]: string } = (ALL_TAGS as any)[ifdName] || {};
                
                return (
                    <div key={ifdName}>
                        <h4 className="font-semibold text-sm capitalize mb-2">{ifdName} IFD</h4>
                        <div className="space-y-1 text-xs">
                        {Object.keys(ifdData).map(tagIdStr => {
                             const tagId = parseInt(tagIdStr);
                             const tagName = tagNames[tagId] || `Unknown (${tagId})`;
                             const value = ifdData[tagId];
                             if (ifdName === 'thumbnail') return null; // Don't display thumbnail data
                             return (
                                 <div key={tagId} className="flex justify-between items-center gap-2">
                                     <span className="text-muted-foreground truncate">{tagName}</span>
                                     <span className="font-mono text-right break-all">{formatExifValue(ifdName, tagName, value)}</span>
                                 </div>
                             )
                        })}
                        </div>
                         <Separator className="my-2"/>
                    </div>
                )
            })}
            </div>
        </ScrollArea>
    )
  }

  if (!imageSrc) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex h-full items-center justify-center"
        >
            <div
                className={cn(
                    "flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-lg p-12 text-center cursor-pointer hover:bg-white/10 transition-colors w-full max-w-lg",
                    isDragging && "bg-white/20 border-white"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CloudUpload className={cn("h-12 w-12 text-slate-400 mb-4 transition-transform", isDragging && "scale-110")} />
                <p className="font-semibold text-white">
                    Click to upload or drag & drop
                </p>
                <p className="text-sm text-slate-400">
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
        </motion.div>
    );
  }

  return (
    <Card className="w-full max-w-4xl shadow-2xl bg-card/50 backdrop-blur-sm border-border/20 flex flex-col overflow-hidden h-[calc(100vh-10rem)]">
        <AnimatePresence mode="wait">
            <motion.div
                key={isEditing ? 'edit' : 'preview'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-grow flex flex-col min-h-0"
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
                <CardContent className="p-6 pt-0 grid md:grid-cols-2 gap-8 items-start flex-grow min-h-0">
                    {!isEditing && (
                        <>
                             <div className="space-y-4 flex flex-col h-full">
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
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
                                <Card className="flex-grow flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Original Metadata</CardTitle>
                                        <CardDescription>
                                            EXIF data found in the original image.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        {renderExifData()}
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Ready to Edit?</CardTitle>
                                        <CardDescription>
                                            You can modify the metadata yourself or use one of our quick actions to get started.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                         <Button onClick={() => setIsEditing(true)} className="w-full bg-primary hover:bg-primary/90">
                                            <Pencil className="mr-2 h-4 w-4" /> Edit Myself
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                         <CardTitle>Quick Actions</CardTitle>
                                        <CardDescription>
                                            Apply common metadata changes with one click.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                         <Button type="button" variant="outline" className="w-full justify-start" onClick={handleRemovePrivacy}><ShieldOff className="mr-2 h-4 w-4" /> Remove Privacy Data</Button>
                                         <p className="text-xs text-muted-foreground px-2">Clears location, date, and time fields.</p>
                                         <Separator className="my-2"/>
                                         <Button type="button" variant="outline" className="w-full justify-start" onClick={handleRemoveAi}><BrainCircuit className="mr-2 h-4 w-4" /> Remove Device Footprint</Button>
                                         <p className="text-xs text-muted-foreground px-2">Clears device make and model fields.</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                    
                    {isEditing && (
                        <>
                            <div className="space-y-4 flex flex-col">
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                                    <AnimatePresence>
                                        {modifiedImageSrc && (
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
                                <ChangesSummary />
                            </div>
                            <div className="space-y-3">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(applyChanges)} className="space-y-3 flex flex-col">
                                        <div className="space-y-2">
                                            <FormLabel>Quick Actions</FormLabel>
                                            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                                                <Button type="button" variant="outline" size="sm" onClick={handleReloadMetadata}><RefreshCcw className="mr-2 h-3 w-3" /> Reload Original</Button>
                                                <Button type="button" variant="destructive" size="sm" onClick={handleRemoveAll}><Trash2 className="mr-2 h-3 w-3" /> Clear All</Button>
                                            </div>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="deviceModel"
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><Camera className="h-4 w-4" />Device Model</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isProcessing}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                    <SelectValue placeholder="Select a device or leave empty" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">None (Remove)</SelectItem>
                                                    {Object.keys(DEVICE_PROFILES).map((model) => (
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
                                        <div>
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
                        </>
                    )}
                </CardContent>
            </motion.div>
        </AnimatePresence>
    </Card>
  );
}


    