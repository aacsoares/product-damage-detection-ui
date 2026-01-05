# Product Damage Detection UI

This is a [Next.js](https://nextjs.org) application for uploading product images and visualizing AI-powered damage predictions. The app interacts with a backend REST API (see Swagger docs at `http://localhost:8080/v3/api-docs`) to analyze images and display bounding boxes for detected features.

## Features

- **Image Upload**: Upload PNG, JPG, or JPEG files from your local device.
- **REST API Integration**: Sends the image to a backend endpoint as multipart/form-data.
- **Prediction Visualization**: Displays the uploaded image with bounding boxes for predictions with probability > 0.5.
- **Clean UI**: Built with Next.js, React, TypeScript, and Tailwind CSS.

## Usage

1. **Start the backend service** (ensure the REST API is running at `http://localhost:8080`).
2. **Start the frontend:**

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.
4. Upload a product image (PNG, JPG, JPEG).
5. View predictions and bounding boxes overlaid on the image.

## API Endpoint

- **POST** `/api/predict` (proxy to backend):

  - Request: `multipart/form-data` with field `file` (the image)
  - Response example:

    ```json
    {
      "success": true,
      "filename": "product_photo.jpg",
      "predictions": {
        "id": "prediction-456",
        "project": "project-uuid",
        "iteration": "iteration-uuid",
        "predictions": [
          {
            "tagId": "tag-uuid",
            "tagName": "no_damage",
            "probability": 0.92,
            "boundingBox": {
              "left": 0.0847,
              "top": 0.3244,
              "width": 0.0215,
              "height": 0.0214
            }
          }
        ]
      }
    }
    ```

## Customization

- Update the API endpoint in `src/app/page.tsx` if your backend URL differs.
- Adjust probability threshold or bounding box styles as needed.

## Development

- Built with Next.js App Router, TypeScript, and Tailwind CSS.
- Code is documented and follows clean code best practices.

---

For more details, see the code in `src/app/page.tsx`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
