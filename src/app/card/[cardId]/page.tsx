import type { Metadata, ResolvingMetadata } from "next";
import CardDisplayClient from "./CardDisplayClient";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";

type Props = {
  params: Promise<{ cardId: string }>;
};
export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { cardId } = await params;

  const cardsQuery = query(
    collection(db, "cards"),
    where("metadata.id", "==", cardId)
  );
  const cardsSnapshot = await getDocs(cardsQuery);

  const CARD_DOC_ID = "mainCard";
  //let imageUrl = "/lovable-uploads/bf370590-9076-4ca0-8853-23a471ef1ede.png";
  let imageUrl =
    "https://firebasestorage.googleapis.com/v0/b/solobizcards-db.firebasestorage.app/o/cardPreviews%2Fogwebsite%2F1762320241293_1761454221996_OG_Logo-2.png?alt=media&token=ead42205-a373-4f0e-95c9-596cf7b99061";
  try {
    const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data?.backupCard?.url) {
        imageUrl = data.backupCard.url;
      } else if (data?.ogImage?.url) {
        imageUrl = data.ogImage.url;
      }
    }
  } catch (error) {
    console.error("Error fetching OG image from Firebase:", error);
  }

  // Default metadata (fallback)
  let cardData: any = {
    title: "Business Card",
    description: "Free! biz cards for small businesses",
    image: imageUrl,
    url: `/card/${cardId}`,
  };

  if (!cardsSnapshot.empty) {
    const cardDoc = cardsSnapshot.docs[0];
    const data = cardDoc.data();

    cardData = {
      title: data?.urlName || "Business Card",
      description: "Free! biz cards for small businesses",
      image:
        data?.profilePhoto && data?.profilePhoto != ""
          ? data?.profilePhoto
          : imageUrl,
      url: `/card/${cardId}`,
    };
  }

  return {
    title: cardData.title,
    description: cardData.description,
    openGraph: {
      title: cardData.title,
      description: cardData.description,
      url: cardData.url,
      images: [
        {
          url: cardData.image,
          width: 1200,
          height: 630,
          alt: "Card Preview",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: cardData.title,
      description: cardData.description,
      images: cardData.image,
    },
  };
}

export default function CardDisplayPage() {
  return <CardDisplayClient />;
}
