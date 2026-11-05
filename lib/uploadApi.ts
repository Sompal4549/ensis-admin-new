import { api } from "./api";
import { getImageSizeError } from "./uploadLimit";

export interface UploadResult {
  url: string;
  publicId?: string;
  data?: {
    url?: string;
    publicId?: string;
  };
}

export const uploadApi = {
  file: async (file: File, folder = "ensis/uploads") => {
    const sizeError = await getImageSizeError(file);
    if (sizeError) throw new Error(sizeError);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    formData.append("subDir", folder.replace(/^ensis[/\\]?/, ""));
    return api.postForm<UploadResult>(`/uploads?folder=${encodeURIComponent(folder)}`, formData);
  },
};
