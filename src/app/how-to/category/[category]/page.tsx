import { redirect } from "next/navigation";

type Props = { params: Promise<{ category: string }> };

export default async function HowToCategoryRedirectPage({ params }: Props) {
  const { category } = await params;
  redirect(`/en/how-to/category/${category}`);
}

