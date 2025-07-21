// This file is for temporary static data to keep some pages working
// during the transition to the TMDB API.
// It is primarily used to seed the database.

type StaticFilm = {
  id: string;
  title: string;
  director: string;
  year: number;
  cast: string[];
  plot: string;
  posterUrl: string;
  averageRating: number;
  popularity: number;
  releaseDate: string;
};


export const films: StaticFilm[] = [
  {
    id: '680', // Pulp Fiction
    title: 'Pulp Fiction',
    director: 'Quentin Tarantino',
    year: 1994,
    cast: ['John Travolta', 'Samuel L. Jackson', 'Uma Thurman'],
    plot: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    posterUrl: '/pci1ArYW7oJ2eyTo2NMYEKHHiCP.jpg',
    averageRating: 4.8,
    popularity: 98,
    releaseDate: '1994-10-14',
  },
  {
    id: '155', // The Dark Knight
    title: 'The Dark Knight',
    director: 'Christopher Nolan',
    year: 2008,
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
    plot: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    posterUrl: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    averageRating: 4.9,
    popularity: 99,
    releaseDate: '2008-07-18',
  },
  {
    id: '27205', // Inception
    title: 'Inception',
    director: 'Christopher Nolan',
    year: 2010,
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
    plot: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    posterUrl: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    averageRating: 4.7,
    popularity: 97,
    releaseDate: '2010-07-16',
  },
    {
    id: '496243', // Parasite
    title: 'Parasite',
    director: 'Bong Joon Ho',
    year: 2019,
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong'],
    plot: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    posterUrl: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    averageRating: 4.6,
    popularity: 95,
    releaseDate: '2019-10-11',
  },
  {
    id: '238', // The Godfather
    title: 'The Godfather',
    director: 'Francis Ford Coppola',
    year: 1972,
    cast: ['Marlon Brando', 'Al Pacino', 'James Caan'],
    plot: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
    posterUrl: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    averageRating: 4.9,
    popularity: 96,
    releaseDate: '1972-03-24',
  },
    {
    id: '129', // Spirited Away
    title: 'Spirited Away',
    director: 'Hayao Miyazaki',
    year: 2001,
    cast: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki'],
    plot: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
    posterUrl: '/39wmItIW2asRooAcZBSnI8rvM6p.jpg',
    averageRating: 4.7,
    popularity: 93,
    releaseDate: '2002-09-20',
  },
  {
    id: '157336', // Interstellar
    title: 'Interstellar',
    director: 'Christopher Nolan',
    year: 2014,
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    plot: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    posterUrl: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    averageRating: 4.6,
    popularity: 94,
    releaseDate: '2014-11-07',
  },
    {
    id: '76341', // Mad Max: Fury Road
    title: 'Mad Max: Fury Road',
    director: 'George Miller',
    year: 2015,
    cast: ['Tom Hardy', 'Charlize Theron', 'Nicholas Hoult'],
    plot: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the help of a group of female prisoners, a psychotic worshiper, and a drifter named Max.',
    posterUrl: '/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg',
    averageRating: 4.5,
    popularity: 90,
    releaseDate: '2015-05-15',
  },
  {
    id: '335984', // Blade Runner 2049
    title: 'Blade Runner 2049',
    director: 'Denis Villeneuve',
    year: 2017,
    cast: ['Ryan Gosling', 'Harrison Ford', 'Ana de Armas'],
    plot: 'Young Blade Runner K\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who\'s been missing for thirty years.',
    posterUrl: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    averageRating: 4.4,
    popularity: 88,
    releaseDate: '2017-10-06',
  },
  {
    id: '324857', // Spider-Man: Into the Spider-Verse
    title: 'Spider-Man: Into the Spider-Verse',
    director: 'Bob Persichetti, Peter Ramsey, Rodney Rothman',
    year: 2018,
    cast: ['Shameik Moore', 'Jake Johnson', 'Hailee Steinfeld'],
    plot: 'Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.',
    posterUrl: '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg',
    averageRating: 4.8,
    popularity: 92,
    releaseDate: '2018-12-14',
  },
  {
    id: '338952', // Arrival
    title: 'Arrival',
    director: 'Denis Villeneuve',
    year: 2016,
    cast: ['Amy Adams', 'Jeremy Renner', 'Forest Whitaker'],
    plot: 'A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.',
    posterUrl: '/x2FJsf1El5Mkr6slZ4h5a4jAHFX.jpg',
    averageRating: 4.3,
    popularity: 85,
    releaseDate: '2016-11-11',
  },
  {
    id: '539961', // Everything Everywhere All at Once
    title: 'Everything Everywhere All at Once',
    director: 'Daniel Kwan, Daniel Scheinert',
    year: 2022,
    cast: ['Michelle Yeoh', 'Ke Huy Quan', 'Stephanie Hsu'],
    plot: 'An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.',
    posterUrl: '/w3LxiVYUpLlpWyWAbbiVHHvoaIM.jpg',
    averageRating: 4.7,
    popularity: 91,
    releaseDate: '2022-04-08',
  },
];
