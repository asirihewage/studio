"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { generateExifAction } from "@/app/actions";
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

export function PhotoFakeApp() {
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [exifData, setExifData] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
      setImageFile(file);
      setImageSrc(URL.createObjectURL(file));
      setExifData(null);
    }
  };

  const handleReset = () => {
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }
    setImageFile(null);
    setImageSrc(null);
    setExifData(null);
    form.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleBackToForm = () => {
    setExifData(null);
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!imageFile) {
      toast({
        variant: "destructive",
        title: "No Image",
        description: "Please upload an image first.",
      });
      return;
    }

    const { date, time, ...rest } = values;
    const [hours, minutes] = time.split(":").map(Number);
    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(hours, minutes, 0, 0);

    const actionValues = {
      ...rest,
      dateTime: combinedDateTime.toISOString(),
    };

    startTransition(async () => {
      const result = await generateExifAction(actionValues);
      if (result.success) {
        setExifData(result.data);
        toast({
          title: "Success!",
          description: "Realistic EXIF data has been generated.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: result.error,
        });
      }
    });
  };

  const handleDownloadExif = () => {
    if (!exifData) return;
    const blob = new Blob([exifData], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${imageFile?.name.split('.')[0]}_exif.txt` || "generated_exif.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  React.useEffect(() => {
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  return (
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
                <Camera className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
                <CardTitle className="text-2xl font-headline">PhotoFake</CardTitle>
                <CardDescription>
                Generate realistic EXIF data for your images.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {!imageSrc && (
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUpload className="h-12 w-12 text-muted-foreground/70 mb-4" />
            <p className="font-semibold text-foreground">
              Click to upload or drag & drop
            </p>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, WEBP up to 10MB
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
            />
          </div>
        )}

        {imageSrc && !exifData && (
          <div className="space-y-6">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
              <Image
                src={imageSrc}
                alt="Uploaded preview"
                layout="fill"
                objectFit="contain"
              />
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><MapPin />Latitude</FormLabel>
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
                        <FormLabel className="flex items-center gap-2"><MapPin />Longitude</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" {...field} disabled={isPending}/>
                        </FormControl>
                         <FormDescription>
                          e.g., New York: 40.7128, -74.0060
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <CardFooter className="flex justify-between p-0">
                    <Button type="button" variant="ghost" onClick={handleReset} disabled={isPending}>
                    Reset
                    </Button>
                    <Button type="submit" disabled={isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Generate EXIF
                    </Button>
                </CardFooter>
              </form>
            </Form>
          </div>
        )}
        
        {imageSrc && exifData && (
            <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-center">Generated EXIF Data</h3>
                <Card className="bg-muted/50 max-h-80 overflow-y-auto">
                    <CardContent className="p-4">
                        <pre className="text-sm whitespace-pre-wrap"><code>{exifData}</code></pre>
                    </CardContent>
                </Card>
                 <CardFooter className="flex justify-between p-0">
                    <Button variant="outline" onClick={handleBackToForm}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Edit
                    </Button>
                    <Button onClick={handleDownloadExif} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Download className="mr-2 h-4 w-4" /> Download EXIF
                    </Button>
                </CardFooter>
            </div>
        )}

      </CardContent>
    </Card>
  );
}
