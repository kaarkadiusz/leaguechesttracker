'use client'

import type { Database } from '@/types/supabase'
import Image from 'next/image';
import { useEffect, useState } from 'react';

type Champion = {
  id: number;
  champion: string;
  name: string;
};

interface Props {
  champions: Champion[];
  callback: Function;
  gridCols?: string;
  portraits?: boolean;
}

export default function ListOfChampions({ champions, callback, gridCols, portraits }: Props) {
  const [cols, setCols] = useState<string>('grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-9')

  useEffect(() => {
    const settings_gridCols = () => {
      switch (gridCols) {
        case '2':
          return 'grid-cols-2'
        case '3':
          return 'grid-cols-3'
        case '4':
          return 'grid-cols-4'
        case '5':
          return 'grid-cols-5'
        case '6':
          return 'grid-cols-6'
        case '7':
          return 'grid-cols-7'
        case '8':
          return 'grid-cols-8'
        case '9':
          return 'grid-cols-9'
        case '10':
          return 'grid-cols-10'

        case 'auto':
        default:
          return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-9'
      }
    }

    setCols(settings_gridCols())
  }, [gridCols])

  return (
    <div className={`grid ${cols} gap-2 m-2`}>
      {champions.map((champion) =>
        <span key={champion.id} onClick={() => callback(champion.id)}>
          <ChampionPortrait name={champion.name ?? ''} champion={champion.champion} portraits={portraits ? 'rounded-full overflow-hidden' : ''}/>
        </span>)}
    </div>
  )
}

interface ChampionPortraitProps {
  name: string;
  champion: string;
  portraits?: string;
}

function ChampionPortrait({ name, champion, portraits }: ChampionPortraitProps) {
  return (
    <div className={`aspect-square bg-slate-800 ${portraits}`}>
      <Image src={`/championavatars/${champion}.png`}
        width={120} height={120} alt={name} title={name} loading='lazy'
        className={`object-fill h-full w-full hover:opacity-50 hover:cursor-pointer ${portraits}`} />
    </div>
  )
}