'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, useRef } from 'react'

import ListOfChampions from './ListOfChampions'

import type { Database } from '@/types/supabase'

type Champion = Database['public']['Tables']['champions']['Row']

type ChampionsFiltered = {
  intersection: Champion[];
  difference: Champion[];
}

export default function ClientComponent() {
  const champions = useRef<Champion[] | null>(null)
  // const [champions, setChampions] = useState<Champion[] | null>(null)
  const [championsByUser, setChampionsByUser] = useState<number[]>([])
  const [championsFiltered, setChampionsFiltered] = useState<ChampionsFiltered>()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const getData = async () => {
      const [championsRes, championsByUserRes] = await Promise.all([
        supabase.from('champions').select().then(res => res.data),
        supabase.from('champions_by_user').select('champions_ids').then(res => res.data)
      ])
      champions.current = championsRes
      setChampionsByUser((championsByUserRes && championsByUserRes[0]?.champions_ids) ? championsByUserRes[0].champions_ids : [])
    }

    getData()
  }, [])

  useEffect(() => {
    if(!championsByUser || ! champions.current) return
    let intersection = champions.current.filter((object) => championsByUser.includes(object.id))
    let difference = champions.current.filter((object) => !championsByUser.includes(object.id))
    setChampionsFiltered({intersection: intersection, difference: difference})
  }, [championsByUser])
  function callback(id: number) {
    setChampionsByUser(prevState => {
      if(prevState.includes(id)) {
        let index = prevState.indexOf(id)
        prevState.splice(index, 1)
        return [...prevState]
      }
      else
      {
          prevState.push(id)
          return [...prevState]
        }
    })
  }

  return (
    <main className='grid grid-cols-2 grid-rows-[auto,1fr] h-full overflow-auto'>
      <header className='col-span-2 p-4 border-b-4 border-[var(--background-slight)]'>header</header>
      {championsFiltered &&
        <>
          <div className='overflow-y-scroll scrollbar-hide bg-lime-800/20 border-r-2 border-[var(--background-slight)]'>
            <ListOfChampions champions={championsFiltered.difference} callback={callback}/>
          </div>
          <div className='overflow-y-scroll scrollbar-hide bg-rose-800/20 border-l-2 border-[var(--background-slight)]'>
            <ListOfChampions champions={championsFiltered.intersection} callback={callback}/>
          </div>
        </>
      }
    </main>
  )
}