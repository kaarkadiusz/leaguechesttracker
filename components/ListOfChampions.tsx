'use client'

import { useEffect, useState } from 'react'

import type { Database } from '@/types/supabase'

type Champion = Database['public']['Tables']['champions']['Row']

interface Props {
  champions: Champion[];
  callback: Function;
}

export default function ListOfChampions({ champions, callback }: Props) {

  return (
    <div className='grid grid-cols-8 gap-2 m-2'>
      {champions.map((champion) => 
      <span key={champion.id} onClick={() => callback(champion.id)}>
        <ChampionPortrait name={champion.name ?? ''} image={champion.image ?? ''}/>
      </span>)}
    </div>
  )
}

interface ChampionPortraitProps {
  name: string;
  image: string;
}

function ChampionPortrait({ name, image }: ChampionPortraitProps) {
  return (
    <div className='aspect-square bg-slate-800'>
      <img
        src={`data:image/png;base64,${image}`}
        alt={name}
        title={name}
        loading='lazy'
        className='object-fill h-full w-full hover:opacity-50 hover:cursor-pointer' />
    </div>
  )
}