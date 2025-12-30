# ExifLab - Image EXIF Data Editor

ExifLab is a web application that allows you to easily edit, remove, and add EXIF metadata to your images. Take control of your photo's digital footprint by modifying camera details, timestamps, GPS location, and more.

This project is built with Next.js, TypeScript, and Tailwind CSS.

## ✨ Features

-   **Upload & Preview:** Upload JPEG, PNG, or AVIF images and see an instant preview.
-   **View EXIF Data:** Inspect all existing EXIF metadata in a clean, readable format.
-   **AI-Powered Scan:** A subtle animation on upload signifies an "AI scan" of the image metadata.
-   **Edit Metadata:**
    -   Choose from a list of pre-defined device profiles (e.g., iPhone 15 Pro, Canon EOS R5) to apply realistic camera data.
    -   Manually set or change the date, time, and GPS coordinates (with a "Use my location" helper).
    -   Edit technical details like aperture, exposure time, ISO, and lens model.
-   **Quick Actions:**
    -   **Remove AI Footprint:** Strip out metadata tags often associated with AI-generated images.
    -   **Remove Privacy Data:** Quickly delete sensitive information like GPS location and timestamps.
    -   **Remove Device Data:** Erase all camera and lens model information.
-   **Live Changes Summary:** See a real-time summary of your pending changes before applying them.
-   **Download Modified Image:** Download the new image with the updated EXIF data as a JPEG file.

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v20 or later)
-   [npm](https://www.npmjs.com/) or another package manager like yarn or pnpm.

### Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/exiflab.app.git
    cd exiflab.app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## 📦 Deployment

This project is configured for easy deployment to **GitHub Pages**.

A GitHub Actions workflow is included in `.github/workflows/deploy.yml`. This workflow will automatically:

1.  Build the Next.js application into static files.
2.  Deploy these files to your `gh-pages` branch.

To enable this, go to your repository's **Settings > Pages** and set the **Source** to **Deploy from a branch**. Then select `gh-pages` as the branch and `/ (root)` as the folder. Your site will be live at `https://your-username.github.io/exiflab.app/`.
