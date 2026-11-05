"use client";

import { useParams } from "next/navigation";
import QuoteEditor from "@/components/QuoteEditor";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <QuoteEditor id={id} />;
}
