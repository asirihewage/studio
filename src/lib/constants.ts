
export type DeviceProfile = {
  make: string;
  model: string;
  software?: string;
  exif: {
    FNumber?: [number, number];
    ExposureTime?: [number, number];
    ISOSpeedRatings?: number;
    FocalLength?: [number, number];
    LensModel?: string;
  };
};

export const DEVICE_PROFILES: Record<string, DeviceProfile> = {
  "Google Pixel 8 Pro": {
    make: "Google",
    model: "Pixel 8 Pro",
    software: "hdr_plus_a.240104.018",
    exif: {
      FNumber: [17, 10], // f/1.7
      ExposureTime: [1, 120],
      ISOSpeedRatings: 50,
      FocalLength: [69, 10], // 6.9mm
      LensModel: "Pixel 8 Pro back camera 6.81mm f/1.68",
    },
  },
  "Samsung Galaxy S24 Ultra": {
    make: "Samsung",
    model: "SM-S928U",
    software: "S928U1UEU1AXCB",
    exif: {
      FNumber: [17, 10], // f/1.7
      ExposureTime: [1, 60],
      ISOSpeedRatings: 50,
      FocalLength: [23, 1], // 23mm
      LensModel: "Galaxy S24 Ultra",
    },
  },
  "Apple iPhone 15 Pro": {
    make: "Apple",
    model: "iPhone 15 Pro",
    software: "17.4.1",
    exif: {
      FNumber: [18, 10], // f/1.8
      ExposureTime: [1, 125],
      ISOSpeedRatings: 32,
      FocalLength: [24, 1], // 24mm
      LensModel: "iPhone 15 Pro back camera 6.86mm f/1.78",
    },
  },
  "OnePlus 12": {
    make: "OnePlus",
    model: "CPH2583",
    exif: {
      FNumber: [16, 10], // f/1.6
      ExposureTime: [1, 100],
      ISOSpeedRatings: 100,
      FocalLength: [23, 1], // 23mm
    },
  },
  "Xiaomi 14 Ultra": {
    make: "Xiaomi",
    model: "24030PN60G",
    exif: {
      FNumber: [16, 10], // f/1.6
      ExposureTime: [1, 50],
      ISOSpeedRatings: 50,
      FocalLength: [23, 1], // 23mm
    },
  },
  "Sony Xperia 1 V": {
    make: "Sony",
    model: "XQ-DQ72",
    exif: {
      FNumber: [19, 10], // f/1.9
      ExposureTime: [1, 640],
      ISOSpeedRatings: 64,
      FocalLength: [24, 1], // 24mm
    },
  },
  "Asus ROG Phone 8 Pro": {
    make: "Asus",
    model: "ASUS_AI2401",
    exif: {
      FNumber: [19, 10], // f/1.9
      ExposureTime: [1, 90],
      ISOSpeedRatings: 25,
      FocalLength: [24, 1], // 24mm
    },
  },
  "Motorola Edge+ (2023)": {
    make: "Motorola",
    model: "motorola edge+ (2023)",
    exif: {
      FNumber: [16, 10], // f/1.6
      ExposureTime: [1, 120],
      ISOSpeedRatings: 100,
      FocalLength: [24, 1], // 24mm
    },
  },
  "Canon EOS 5D Mark IV": {
    make: "Canon",
    model: "Canon EOS 5D Mark IV",
    exif: {
      FNumber: [28, 10], // f/2.8
      ExposureTime: [1, 250],
      ISOSpeedRatings: 100,
      FocalLength: [50, 1], // 50mm
      LensModel: "EF50mm f/1.8 STM",
    },
  },
  "Canon EOS R5": {
    make: "Canon",
    model: "Canon EOS R5",
    exif: {
      FNumber: [40, 10], // f/4.0
      ExposureTime: [1, 500],
      ISOSpeedRatings: 200,
      FocalLength: [70, 1], // 70mm
      LensModel: "RF24-70mm F2.8 L IS USM",
    },
  },
  "Nikon Z7 II": {
    make: "Nikon",
    model: "NIKON Z 7II",
    exif: {
      FNumber: [80, 10], // f/8.0
      ExposureTime: [1, 125],
      ISOSpeedRatings: 64,
      FocalLength: [24, 1], // 24mm
      LensModel: "NIKKOR Z 24-70mm f/2.8 S",
    },
  },
  "Nikon D850": {
    make: "Nikon",
    model: "NIKON D850",
    exif: {
      FNumber: [56, 10], // f/5.6
      ExposureTime: [1, 400],
      ISOSpeedRatings: 400,
      FocalLength: [200, 1], // 200mm
      LensModel: "70-200mm f/2.8",
    },
  },
  "Sony a7 IV": {
    make: "Sony",
    model: "ILCE-7M4",
    software: "ILCE-7M4 v1.01",
    exif: {
      FNumber: [20, 10], // f/2.0
      ExposureTime: [1, 1000],
      ISOSpeedRatings: 100,
      FocalLength: [35, 1], // 35mm
      LensModel: "FE 35mm F1.4 GM",
    },
  },
  "Sony a1": {
    make: "Sony",
    model: "ILCE-1",
    exif: {
      FNumber: [14, 10], // f/1.4
      ExposureTime: [1, 2000],
      ISOSpeedRatings: 100,
      FocalLength: [50, 1], // 50mm
      LensModel: "FE 50mm F1.2 GM",
    },
  },
  "Fujifilm X-T5": {
    make: "FUJIFILM",
    model: "X-T5",
    exif: {
      FNumber: [20, 10], // f/2.0
      ExposureTime: [1, 180],
      ISOSpeedRatings: 160,
      FocalLength: [35, 1], // 35mm
      LensModel: "XF35mmF1.4 R",
    },
  },
  "Fujifilm GFX 100S": {
    make: "FUJIFILM",
    model: "GFX100S",
    exif: {
      FNumber: [110, 10], // f/11
      ExposureTime: [1, 125],
      ISOSpeedRatings: 100,
      FocalLength: [110, 1], // 110mm
      LensModel: "GF110mmF2 R LM WR",
    },
  },
  "Kodak PIXPRO AZ401": {
    make: "Kodak",
    model: "PIXPRO AZ401",
    exif: {
      FNumber: [37, 10], // f/3.7
      ExposureTime: [1, 160],
      ISOSpeedRatings: 80,
      FocalLength: [43, 10], // 4.3mm
    },
  },
  "Kodak EASYSHARE Z981": {
    make: "EASTMAN KODAK COMPANY",
    model: "KODAK EASYSHARE Z981",
    exif: {
      FNumber: [28, 10], // f/2.8
      ExposureTime: [1, 30],
      ISOSpeedRatings: 64,
      FocalLength: [46, 10], // 4.6mm
    },
  },
  "Apple iPhone 13": {
    make: "Apple",
    model: "iPhone 13",
    software: "16.1",
    exif: {
      FNumber: [16, 10], // f/1.6
      ExposureTime: [1, 121],
      ISOSpeedRatings: 50,
      FocalLength: [42, 10], // 4.2mm
    },
  },
  "Google Pixel 6": {
    make: "Google",
    model: "Pixel 6",
    exif: {
      FNumber: [185, 100], // f/1.85
      ExposureTime: [1, 100],
      ISOSpeedRatings: 42,
      FocalLength: [681, 100], // 6.81mm
    },
  },
};

export const ANDROID_PHONE_MODELS = [
  "Google Pixel 8 Pro",
  "Samsung Galaxy S24 Ultra",
  "OnePlus 12",
  "Xiaomi 14 Ultra",
  "Sony Xperia 1 V",
  "Asus ROG Phone 8 Pro",
  "Motorola Edge+ (2023)",
];
