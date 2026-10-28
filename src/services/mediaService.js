import { API_BASE_URL } from "../config/api";

export class MediaService {
  static async getAuthToken() {
    const { auth } = await import("../demo/session");
    const { getAuth } = await import("../demo/session");
    const authInstance = getAuth();
    const user = authInstance.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    return token;
  }

  static async getPresignedUploadUrl(key, contentType, publicRead = true) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/media/presigned-upload-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key,
          contentType,
          publicRead,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to get presigned URL: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting presigned URL:", error);
      throw error;
    }
  }

  static async uploadFileToS3WithFallback(presignedUrl, file) {
    const methods = [
      () => this.uploadViaXHR(presignedUrl, file, false),
      () => this.uploadViaFetch(presignedUrl, file, false),
      () => this.uploadViaXHR(presignedUrl, file, true),
      () => this.uploadViaFetch(presignedUrl, file, true),
    ];

    let lastError;
    const errors = [];
    for (let i = 0; i < methods.length; i++) {
      try {
        await methods[i]();
        return true;
      } catch (error) {
        lastError = error;
        errors.push(`Method ${i + 1}: ${error.message}`);
        if (i === methods.length - 1) {
          const errorMessage = errors.some(e => e.includes('CORS') || e.includes('403'))
            ? 'CORS error: S3 bucket is not configured for cross-origin requests. Please configure CORS on the S3 bucket or use a backend proxy for file uploads.'
            : `All upload methods failed. Errors: ${errors.join('; ')}`;
          throw new Error(errorMessage);
        }
      }
    }
  }

  static uploadViaXHR(presignedUrl, file, withHeaders = true) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("PUT", presignedUrl, true);

      if (withHeaders) {
        xhr.setRequestHeader("Content-Type", file.type);
      }

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || xhr.status === 204) {
            resolve(true);
          } else {
            reject(new Error(`XHR upload failed with status: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = function () {
        reject(new Error("XHR upload network error"));
      };

      xhr.send(file);
    });
  }

  static async uploadViaFetch(presignedUrl, file, withContentType = true) {
    const options = {
      method: "PUT",
      body: file,
    };
    
    if (withContentType && file.type) {
      options.headers = {
        "Content-Type": file.type,
      };
    }
    
    const response = await fetch(presignedUrl, options);
    
    if (!response.ok) {
      throw new Error(`Fetch upload failed with status: ${response.status} ${response.statusText}`);
    }
    
    return true;
  }


  static async getPublicFileUrl(key) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/media/file-url?key=${encodeURIComponent(key)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to get public URL: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting public URL:", error);
      throw error;
    }
  }

  static generateCampusImageKey(campusName, imageIndex, fileName) {
    const timestamp = Date.now();
    const cleanCampusName = campusName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

    return `images/campuses/${cleanCampusName}-${timestamp}/image-${imageIndex}-${cleanFileName}`;
  }

  static generateSchoolImageKey(schoolName, imageIndex, fileName) {
    const timestamp = Date.now();
    const cleanSchoolName = schoolName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

    return `images/schools/${cleanSchoolName}-${timestamp}/image-${imageIndex}-${cleanFileName}`;
  }

  static generateAccommodationImageKey(accommodationName, imageIndex, fileName) {
    const timestamp = Date.now();
    const cleanAccommodationName = accommodationName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

    return `images/accommodations/${cleanAccommodationName}-${timestamp}/image-${imageIndex}-${cleanFileName}`;
  }

  static generateSchoolLogoKey(schoolName, fileName) {
    const timestamp = Date.now();
    const cleanSchoolName = schoolName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

    return `images/schools/${cleanSchoolName}-${timestamp}/logo-${cleanFileName}`;
  }

  static generateSchoolAwardKey(schoolName, fileName) {
    const timestamp = Date.now();
    const cleanSchoolName = schoolName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

    return `images/schools/${cleanSchoolName}-${timestamp}/award-${cleanFileName}`;
  }

  static generatePackageImageKey(packageName, fileName) {
    const timestamp = Date.now();
    const cleanPackageName = packageName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

    return `images/packages/${cleanPackageName}-${timestamp}/image-${cleanFileName}`;
  }

  static generateExperienceImageKey(experienceName, fileName) {
    const timestamp = Date.now();
    const cleanName = experienceName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

    return `images/experiences/${cleanName}-${timestamp}/image-${cleanFileName}`;
  }

  static async uploadCampusImages(images, campusName) {
    const uploadedImages = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      try {
        let file;
        let fileName;

        if (image.file) {
          file = image.file;
          fileName = file.name;
        } else if (image.imageUrl && image.imageUrl.startsWith("blob:")) {
          const response = await fetch(image.imageUrl);
          file = await response.blob();
          fileName = `image-${i + 1}.jpg`;
        } else if (image.imageUrl && image.imageUrl.startsWith("http")) {
          uploadedImages.push({ imageUrl: image.imageUrl });
          continue;
        } else if (image.preview && image.preview.startsWith("http")) {
          uploadedImages.push({ imageUrl: image.preview });
          continue;
        } else {
          console.warn(`Skipping image ${i + 1}: cannot determine file`);
          continue;
        }

        try {
          const key = this.generateCampusImageKey(campusName, i + 1, fileName);
          const presignedData = await this.getPresignedUploadUrl(key, file.type, true);

          await this.uploadFileToS3WithFallback(presignedData.url, file);

          const imageUrl =
            presignedData.publicUrl;
          uploadedImages.push({ imageUrl });
        } catch (s3Error) {
          console.error(`S3 upload failed for campus image ${i + 1}:`, s3Error.message);
          throw s3Error;
        }
      } catch (error) {
        console.error(`Failed to process image ${i + 1}:`, error);
        if (image.imageUrl) {
          uploadedImages.push({ imageUrl: image.imageUrl });
        }
      }
    }

    return uploadedImages;
  }

  static async uploadSchoolImages(images, schoolName) {
    const uploadedImages = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      try {
        let file = image.file;
        let fileName = `school-image-${i + 1}.jpg`;

        if (!file && image.imageUrl && image.imageUrl.startsWith("blob:")) {
          try {
            const response = await fetch(image.imageUrl);
            file = await response.blob();
            fileName = `school-image-${i + 1}.jpg`;
          } catch (error) {
            console.warn(`Failed to fetch blob for school image ${i + 1}:`, error);
            uploadedImages.push({
              imageUrl: image.imageUrl,
              description: image.description || image.caption || `School image ${i + 1}`,
            });
            continue;
          }
        } else if (!file && image.imageUrl) {
          uploadedImages.push({
            imageUrl: image.imageUrl,
            description: image.description || image.caption || `School image ${i + 1}`,
          });
          continue;
        }

        if (!file) {
          console.warn(`No file found for school image ${i + 1}`);
          continue;
        }

        try {
          const key = this.generateSchoolImageKey(schoolName, i + 1, fileName);
          const presignedData = await this.getPresignedUploadUrl(key, file.type, true);

          await this.uploadFileToS3WithFallback(presignedData.url, file);

          const imageUrl =
            presignedData.publicUrl;
          uploadedImages.push({
            imageUrl,
            description: image.description || image.caption || `School image ${i + 1}`,
          });
        } catch (s3Error) {
          console.error(`S3 upload failed for school image ${i + 1}:`, s3Error.message);
          throw s3Error;
        }
      } catch (error) {
        console.error(`Failed to process school image ${i + 1}:`, error);
        if (image.imageUrl) {
          uploadedImages.push({
            imageUrl: image.imageUrl,
            description: image.description || image.caption || `School image ${i + 1}`,
          });
        }
      }
    }

    return uploadedImages;
  }

  static async uploadAccommodationImages(images, accommodationName) {
    const uploadedImages = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      try {
        let file = image.file;
        let fileName = `accommodation-image-${i + 1}.jpg`;

        if (!file && image.imageUrl && image.imageUrl.startsWith("blob:")) {
          try {
            const response = await fetch(image.imageUrl);
            file = await response.blob();
            fileName = `accommodation-image-${i + 1}.jpg`;
          } catch (error) {
            console.warn(`Failed to fetch blob for accommodation image ${i + 1}:`, error);
            uploadedImages.push({
              imageUrl: image.imageUrl,
              description: image.description || image.caption || `Accommodation image ${i + 1}`,
            });
            continue;
          }
        } else if (!file && image.imageUrl) {
          uploadedImages.push({
            imageUrl: image.imageUrl,
            description: image.description || image.caption || `Accommodation image ${i + 1}`,
          });
          continue;
        }

        if (!file) {
          console.warn(`No file found for accommodation image ${i + 1}`);
          continue;
        }

        try {
          const key = this.generateAccommodationImageKey(accommodationName, i + 1, fileName);
          const presignedData = await this.getPresignedUploadUrl(key, file.type, true);

          await this.uploadFileToS3WithFallback(presignedData.url, file);

          const imageUrl =
            presignedData.publicUrl;
          uploadedImages.push({
            imageUrl,
            description: image.description || image.caption || `Accommodation image ${i + 1}`,
          });
        } catch (s3Error) {
          console.error(`S3 upload failed for accommodation image ${i + 1}:`, s3Error.message);
          throw s3Error;
        }
      } catch (error) {
        console.error(`Failed to process accommodation image ${i + 1}:`, error);
        if (image.imageUrl) {
          uploadedImages.push({
            imageUrl: image.imageUrl,
            description: image.description || image.caption || `Accommodation image ${i + 1}`,
          });
        }
      }
    }

    return uploadedImages;
  }

  static async uploadSchoolLogo(logoFile, schoolName, fileName = "logo.jpg") {
    try {
      const key = this.generateSchoolLogoKey(schoolName, fileName);
      const presignedData = await this.getPresignedUploadUrl(key, logoFile.type, true);

      await this.uploadFileToS3WithFallback(presignedData.url, logoFile);

      const imageUrl =
        presignedData.publicUrl;

      return imageUrl;
    } catch (error) {
      console.error(`Failed to upload school logo:`, error);
      throw error;
    }
  }

  static async uploadSchoolAward(awardFile, schoolName, fileName = "award.jpg") {
    try {
      const key = this.generateSchoolAwardKey(schoolName, fileName);
      const presignedData = await this.getPresignedUploadUrl(key, awardFile.type, true);

      await this.uploadFileToS3WithFallback(presignedData.url, awardFile);

      const imageUrl =
        presignedData.publicUrl;

      return imageUrl;
    } catch (error) {
      console.error(`Failed to upload school award:`, error);
      throw error;
    }
  }

  static generateServiceCoverKey(serviceName, fileName) {
    const timestamp = Date.now();
    const cleanName = String(serviceName || "service").replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
    const cleanFileName = String(fileName || "cover.jpg").replace(/[^a-zA-Z0-9.-]/g, "_");

    return `images/services/${cleanName}-${timestamp}/cover-${cleanFileName}`;
  }

  static async uploadServiceCoverImage(imageFile, serviceName) {
    const key = this.generateServiceCoverKey(serviceName, imageFile?.name);
    const presignedData = await this.getPresignedUploadUrl(key, imageFile.type, true);
    await this.uploadFileToS3WithFallback(presignedData.url, imageFile);
    return presignedData.publicUrl;
  }

  static async uploadPackageImage(imageFile, packageName, fileName = null) {
    try {
      const fileFileName = fileName || imageFile.name || "package-image.jpg";
      const key = this.generatePackageImageKey(packageName, fileFileName);
      const presignedData = await this.getPresignedUploadUrl(key, imageFile.type, true);

      await this.uploadFileToS3WithFallback(presignedData.url, imageFile);

      const imageUrl =
        presignedData.publicUrl;

      return imageUrl;
    } catch (error) {
      console.error(`Failed to upload package image:`, error);
      throw error;
    }
  }

  static async uploadPackageImages(images, packageName) {
    const uploadedImages = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      try {
        let file;
        let fileName;

        if (image.file) {
          file = image.file;
          fileName = file.name;
        } else if (image.imageUrl && image.imageUrl.startsWith("blob:")) {
          const response = await fetch(image.imageUrl);
          file = await response.blob();
          fileName = `image-${i + 1}.jpg`;
        } else if (image.imageUrl && image.imageUrl.startsWith("http")) {
          uploadedImages.push({ imageUrl: image.imageUrl });
          continue;
        } else if (image.preview && image.preview.startsWith("http")) {
          uploadedImages.push({ imageUrl: image.preview });
          continue;
        } else {
          console.warn(`Skipping image ${i + 1}: cannot determine file`);
          continue;
        }

        try {
          const key = this.generatePackageImageKey(packageName, fileName);
          const presignedData = await this.getPresignedUploadUrl(key, file.type, true);

          await this.uploadFileToS3WithFallback(presignedData.url, file);

          const imageUrl =
            presignedData.publicUrl;
          uploadedImages.push({ imageUrl });
        } catch (s3Error) {
          console.error(`S3 upload failed for package image ${i + 1}:`, s3Error.message);
          throw s3Error;
        }
      } catch (error) {
        console.error(`Failed to process image ${i + 1}:`, error);
        if (image.imageUrl && image.imageUrl.startsWith("http") && !image.imageUrl.startsWith("blob:")) {
          uploadedImages.push({ imageUrl: image.imageUrl });
        } else if (image.file || (image.imageUrl && image.imageUrl.startsWith("blob:"))) {
          throw error;
        }
      }
    }

    return uploadedImages;
  }

  static async uploadExperienceImages(images, experienceName) {
    const uploadedImages = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      try {
        let file;
        let fileName;

        if (image.file) {
          file = image.file;
          fileName = file.name;
        } else if (image.imageUrl && image.imageUrl.startsWith("blob:")) {
          const response = await fetch(image.imageUrl);
          file = await response.blob();
          fileName = `image-${i + 1}.jpg`;
        } else if (image.imageUrl && image.imageUrl.startsWith("http")) {
          uploadedImages.push({
            imageUrl: image.imageUrl,
            order: i,
          });
          continue;
        } else if (image.preview && image.preview.startsWith("http")) {
          uploadedImages.push({
            imageUrl: image.preview,
            order: i,
          });
          continue;
        } else {
          continue;
        }

        const key = this.generateExperienceImageKey(experienceName, fileName);
        const presignedData = await this.getPresignedUploadUrl(key, file.type, true);

        await this.uploadFileToS3WithFallback(presignedData.url, file);

        const imageUrl =
          presignedData.publicUrl;
        uploadedImages.push({ imageUrl, order: i });
      } catch (error) {
        console.error(`Failed to process experience image ${i + 1}:`, error);
        if (image.imageUrl && image.imageUrl.startsWith("http") && !image.imageUrl.startsWith("blob:")) {
          uploadedImages.push({
            imageUrl: image.imageUrl,
            order: i,
          });
        } else if (image.file || (image.imageUrl && image.imageUrl.startsWith("blob:"))) {
          throw error;
        }
      }
    }

    return uploadedImages;
  }
}
