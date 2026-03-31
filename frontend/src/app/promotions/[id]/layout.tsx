import { Metadata } from 'next';
import { tenantFetch } from '@/lib/tenant';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const response = await tenantFetch(`${process.env.NEXT_PUBLIC_API_URL}/promotions/${params.id}/public`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        title: 'Promotion Not Found',
      };
    }

    const promotion = await response.json();

    const title = `${promotion.name} - OMEGA Afro Shop`;
    const description = promotion.description || `Get ${promotion.discountType === 'PERCENT' ? `${promotion.discountValue}% OFF` : `£${promotion.discountValue} OFF`} with this exclusive promotion!`;
    const imageUrl = promotion.imageUrl || `${process.env.NEXT_PUBLIC_FRONTEND_URL}/omega-logo.png`;
    const url = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/promotions/${params.id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: 'OMEGA Afro Caribbean Superstore',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: promotion.name,
          },
        ],
        locale: 'en_GB',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Promotion - OMEGA Afro Shop',
    };
  }
}

export default function PromotionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
