export function inferImageMimeType(file) {
  if (!file) return "";
  let t = file.type || "";
  if (t === "image/jpg") t = "image/jpeg";
  if (t && t.startsWith("image/")) return t;
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return t;
}

export function isAllowedImageFile(file, acceptedMimeTypes) {
  const mime = inferImageMimeType(file);
  if (mime && acceptedMimeTypes.has(mime)) return true;
  const name = (file.name || "").toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].some((ext) => name.endsWith(ext));
}

export function collectEntityImageGallery(data) {
  if (!data || typeof data !== "object") return [];

  const items = [];
  const seenUrls = new Set();

  const pushItem = (url, id, canDelete = false) => {
    const u = typeof url === "string" ? url.trim() : "";
    if (!u || seenUrls.has(u)) return;
    seenUrls.add(u);
    items.push({
      id: id != null ? String(id) : `gallery-${items.length}`,
      url: u,
      canDelete: Boolean(canDelete),
    });
  };

  if (Array.isArray(data.media)) {
    data.media.forEach((m, idx) => {
      const url =
        m?.url || m?.imageUrl || m?.src || (typeof m?.image === "string" ? m.image : "") || "";
      const rawId =
        m?.id ?? m?.mediaId ?? m?.media_id ?? m?.fileId ?? m?.file_id ?? m?.uuid ?? null;
      const hasServerId = rawId != null && String(rawId).trim() !== "";
      const id = hasServerId ? String(rawId).trim() : `media-${idx}`;
      pushItem(url, id, hasServerId);
    });
  }

  const nested = data.image && typeof data.image === "object" ? data.image.url || "" : "";
  const fallbacks = [
    nested,
    typeof data.image === "string" ? data.image : "",
    data.imageUrl,
    data.image_url,
    data.flagUrl,
    data.flag_url,
    data.coverImageUrl,
    data.cover_image_url,
    data.photoUrl,
    data.photo_url,
    data.bannerUrl,
    data.banner_url,
  ];

  for (const u of fallbacks) {
    if (u) pushItem(u, `legacy-${items.length}`, false);
  }

  return items;
}

export const formatImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  if (imageUrl.startsWith("blob:")) return null;

  if (imageUrl.startsWith("data:")) return imageUrl;

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;

  if (imageUrl.startsWith("/9j/")) {
    return `data:image/jpeg;base64,${imageUrl}`;
  }

  if (imageUrl.startsWith("iVBORw0KGgo")) {
    return `data:image/png;base64,${imageUrl}`;
  }

  return `data:image/jpeg;base64,${imageUrl}`;
};

export class ImageProcessingUtils {
  static async compressImage(file, maxWidth = 200, quality = 0.7) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          try {
            const { width, height } = img;

            let targetWidth = maxWidth;
            let targetQuality = quality;

            if (width > 800 || height > 800) {
              targetWidth = 150;
              targetQuality = 0.56;
            } else if (width > 600 || height > 600) {
              targetWidth = 180;
              targetQuality = 0.63;
            }

            const ratio = Math.min(targetWidth / width, targetWidth / height);
            const newWidth = width * ratio;
            const newHeight = height * ratio;

            canvas.width = newWidth;
            canvas.height = newHeight;

            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            canvas.toBlob(resolve, "image/jpeg", targetQuality);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = (error) => {
          reject(error);
        };

        img.src = URL.createObjectURL(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  static async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  static getBase64Size(base64String) {
    const base64Data = base64String.split(",")[1];
    return Math.ceil((base64Data.length * 3) / 4);
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  static async compressImages(images, maxWidth = 200, quality = 0.7, includeDescription = false) {
    const compressionPromises = images.map(async (image, index) => {
      try {
        const description = includeDescription
          ? image.caption || image.description || ""
          : undefined;
        const result = { imageUrl: "", ...(includeDescription && { description }) };

        if (image.file) {
          try {
            const compressedBlob = await this.compressImage(image.file, maxWidth, quality);
            const base64 = await this.fileToBase64(compressedBlob);
            const size = this.getBase64Size(base64);
            console.log(`Image ${index + 1} compressed to: ${this.formatFileSize(size)}`);
            result.imageUrl = base64;
          } catch (compressionError) {
            const base64 = await this.fileToBase64(image.file);
            result.imageUrl = base64;
          }
        } else if (image.imageUrl && image.imageUrl.startsWith("blob:")) {
          try {
            const response = await fetch(image.imageUrl);
            const blob = await response.blob();
            const base64 = await this.fileToBase64(blob);
            result.imageUrl = base64;
          } catch (error) {
            result.imageUrl = image.imageUrl;
          }
        } else if (image.imageUrl) {
          result.imageUrl = image.imageUrl;
        } else if (image.preview && !image.preview.startsWith("blob:")) {
          result.imageUrl = image.preview;
        } else {
          result.imageUrl = image.imageUrl || image.preview || "";
        }

        if (includeDescription) {
          result.description = description;
        }

        return result;
      } catch (error) {
        const result = {
          imageUrl: image.imageUrl || image.preview || "",
          ...(includeDescription && { description: image.caption || image.description || "" }),
        };
        return result;
      }
    });

    try {
      const compressedImages = await Promise.all(compressionPromises);
      return compressedImages;
    } catch (error) {
      const compressedImages = [];
      for (let i = 0; i < images.length; i++) {
        try {
          const image = images[i];
          const description = includeDescription
            ? image.caption || image.description || ""
            : undefined;
          const result = { imageUrl: "", ...(includeDescription && { description }) };

          if (image.file) {
            const base64 = await this.fileToBase64(image.file);
            result.imageUrl = base64;
          } else if (image.imageUrl) {
            result.imageUrl = image.imageUrl;
          } else if (image.preview) {
            result.imageUrl = image.preview;
          }

          if (includeDescription) {
            result.description = description;
          }

          compressedImages.push(result);
        } catch (fallbackError) {}
      }
      return compressedImages;
    }
  }

  static checkImagesSize(images, maxSizeBytes = 2 * 1024 * 1024) {
    const totalSize = images.reduce((total, img) => {
      return total + this.getBase64Size(img.imageUrl);
    }, 0);

    console.log(`Total images size: ${this.formatFileSize(totalSize)}`);

    if (totalSize > maxSizeBytes) {
      console.warn(
        `Warning: Total image size is very large (${this.formatFileSize(
          totalSize
        )}). This might cause server errors.`
      );
    }

    return totalSize;
  }

  static async compressImageSimple(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}
