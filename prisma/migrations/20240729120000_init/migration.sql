-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Film" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "posterPath" TEXT,
    "releaseDate" TEXT,
    "voteAverage" DOUBLE PRECISION,

    CONSTRAINT "Film_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "review" TEXT,
    "loggedDate" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "filmId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filmId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilmList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilmList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilmOnList" (
    "filmId" INTEGER NOT NULL,
    "listId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FilmOnList_pkey" PRIMARY KEY ("filmId","listId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Film_id_key" ON "Film"("id");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_userId_filmId_key" ON "JournalEntry"("userId", "filmId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_userId_filmId_key" ON "WatchlistItem"("userId", "filmId");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilmList" ADD CONSTRAINT "FilmList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilmOnList" ADD CONSTRAINT "FilmOnList_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilmOnList" ADD CONSTRAINT "FilmOnList_listId_fkey" FOREIGN KEY ("listId") REFERENCES "FilmList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
