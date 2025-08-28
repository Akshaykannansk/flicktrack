"use client";

import { useState } from "react";
import { FilmCard } from "./film-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { PersonDetails } from "@/lib/types";

const INITIAL_FILMS_TO_SHOW = 8;

function FilmographyTab({ films }: { films: any[] }) {
  const [filmsToShow, setFilmsToShow] = useState(INITIAL_FILMS_TO_SHOW);

  const handleShowMore = () => {
    setFilmsToShow(filmsToShow + INITIAL_FILMS_TO_SHOW);
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {films.slice(0, filmsToShow).map(film => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>
      {films.length > filmsToShow && (
        <div className="flex justify-center mt-4">
          <Button onClick={handleShowMore}>Show More</Button>
        </div>
      )}
    </div>
  );
}

export function Filmography({ filmography }: { filmography: PersonDetails['filmography'] }) {
    const filmographyTabs = [
        { title: "Acting", films: filmography.acting },
        { title: "Directing", films: filmography.directing },
        { title: "Producing", films: filmography.producing },
        { title: "Writing", films: filmography.writing },
    ].filter(tab => tab.films.length > 0);


    return (
        <div>
            <h2 className="text-2xl font-headline font-semibold mb-4">Filmography</h2>
            <Tabs defaultValue={filmographyTabs[0]?.title} className="w-full">
            <TabsList>
                {filmographyTabs.map(tab => (
                <TabsTrigger key={tab.title} value={tab.title}>{tab.title}</TabsTrigger>
                ))}
            </TabsList>

            {filmographyTabs.map(tab => (
                <TabsContent key={tab.title} value={tab.title}>
                    <FilmographyTab films={tab.films} />
                </TabsContent>
            ))}
            </Tabs>
      </div>
    )
}