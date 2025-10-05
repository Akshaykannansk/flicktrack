
import { getPersonDetails } from "@/lib/tmdb-server";
import { notFound } from "next/navigation";
import { PersonDetails } from "@/components/person-details";

export default async function PersonPage({ params }: any) {
  const { id } = await params;
  const person = await getPersonDetails(id);

  if (!person) {
    notFound();
  }

  return <PersonDetails person={person} />;
}
