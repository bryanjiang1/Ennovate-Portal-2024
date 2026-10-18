import { storage } from "@/lib/firebase";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadString,
} from "firebase/storage";

export const urlizeString = (str: string) => {
  return str.replace(/\s+/g, "-").toLowerCase();
};

export const getImageExtensionFromBase64 = (base64Str: string) => {
  const match = base64Str.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
  return match ? match[1] : "";
};

export const getImageExtensionFromFirebaseLink = (firebaseLink: string) => {
  const match = firebaseLink.match(/\.(png|jpeg|jpg)(?=\?alt=media)/);
  return match ? match[1] : "";
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const generateDrivePreviewURL = (drive: string) => {
  let strToReplace;
  if (drive.includes("view")) {
    strToReplace = "view?usp=sharing";
  } else {
    strToReplace = "edit?usp=sharing";
  }
  return drive.replace(strToReplace, "preview");
};

export const validateFirebaseImageLink = (firebaseLink: string) => {
  return (
    firebaseLink.includes("firebasestorage.googleapis.com") &&
    firebaseLink.includes("ennovate-portal-2024.appspot.com")
  );
};

export async function uploadBase64ImageToFirebase(
  image: string,
  name: string,
  folder: string
) {
  try {
    const urlizedName = urlizeString(name);
    const fileExtension = getImageExtensionFromBase64(image);
    const imagePath = `${folder}/${urlizedName}.${fileExtension}`;
    const storageRef = ref(storage, imagePath);
    await uploadString(storageRef, image, "data_url");
    const imageUrl = await getDownloadURL(storageRef);
    return imageUrl;
  } catch (error) {
    throw new Error("Failed to upload image");
  }
}

export async function deleteBase64ImageFromFirebase(
  image: string,
  name: string,
  folder: string
) {
  try {
    const urlizedName = urlizeString(name);
    const fileExtension = getImageExtensionFromFirebaseLink(image);
    const imagePath = `${folder}/${urlizedName}.${fileExtension}`;
    const storageRef = ref(storage, imagePath);
    await deleteObject(storageRef);
  } catch (error) {
    throw new Error("Failed to delete image");
  }
}

export async function deleteFirebaseImage(imageUrl: string) {
  // The member's name can change independently of its stored photo path.
  await deleteObject(ref(storage, imageUrl));
}

export async function parseMediumMetadata(html: string) {}
