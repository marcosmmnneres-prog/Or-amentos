"use client";

import { useParams } from "next/navigation";
import ComparisonEditor from "@/components/ComparisonEditor";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <ComparisonEditor id={id} />;
}
