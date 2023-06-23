'use client'

import type { Database } from '@/types/supabase'
import Image from 'next/image';

type Champion = Omit<Database['public']['Tables']['champions']['Row'], 'image'>

interface Props {
  champions: Champion[];
  callback: Function;
}

export default function ListOfChampions({ champions, callback }: Props) {

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 m-2'>
      {champions.map((champion) =>
        <span key={champion.id} onClick={() => callback(champion.id)}>
          <ChampionPortrait name={champion.name ?? ''} />
        </span>)}
    </div>
  )
}

interface ChampionPortraitProps {
  name: string;
}

function ChampionPortrait({ name }: ChampionPortraitProps) {
  return (
    <div className='aspect-square bg-slate-800'>
      <Image src={`/championavatars/${name}.png`} 
      width={120} height={120} alt={name} title={name} loading='lazy' 
      className='object-fill h-full w-full hover:opacity-50 hover:cursor-pointer'/>
      {/* <img
        src={`/championavatars/${name}.png`}
        // src={`data:image/png;base64,${image}`}
        alt={name}
        title={name}
        loading='lazy'
        className='object-fill h-full w-full hover:opacity-50 hover:cursor-pointer' /> */}
    </div>
  )
}