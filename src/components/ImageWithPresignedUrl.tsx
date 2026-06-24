// ImageWithPresignedUrl.tsx

/*
Back-end is saving the photos at a signed url for security purposes. 
This signed url contains the access key, bucket name etc.
This function is to access that signed url and donwload the photo.
*/

import { useState, useEffect } from "react";
// Import the new authenticated API hook
import { useApi } from "../utilities/api";
import { S3_photoUrl } from "../../src/constants";

function ImageWithPresignedUrl(objectKeyName: any) {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const api = useApi(); // New authenticated API hook

  useEffect(() => {
    if (!objectKeyName) {
      setError("Object key name is undefined");
      return;
    }

    const fetchPresignedUrl = async () => {
      setLoading(true);
      try {
        // S3_photoURL is the backend endpoint, loaded from index.tsx
        const endpointUrl = S3_photoUrl(objectKeyName); // This function must correctly handle the objectKeyName
        const apiClient = api.client; // Get the axios instance from the hook
        const response = await apiClient.get<{ url: string }>(endpointUrl);
        const data = response.data;

        if (data.url) {
          setImageUrl(data.url);
        } else {
          setError("Failed to load image. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching presigned URL:", error);
        setError("Error fetching image.");
      } finally {
        setLoading(false);
      }
    };

    fetchPresignedUrl();
  }, [objectKeyName]);

  return { imageUrl, loading, error };
}

export default ImageWithPresignedUrl;
