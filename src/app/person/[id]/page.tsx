
import { getPersonDetails } from "@/lib/tmdb";
import { notFound } from "next/navigation";
import { PersonDetails } from "@/components/person-details";

export default async function PersonPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const person = await getPersonDetails(id);

  if (!person) {
    notFound();
  }

  return <PersonDetails person={person} />;
}
