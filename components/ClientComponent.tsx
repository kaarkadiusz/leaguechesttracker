'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, useRef } from 'react'

import ListOfChampions from './ListOfChampions'

import { User } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import Alert from './Alert'

type Champion = Omit<Database['public']['Tables']['champions']['Row'], 'image'>

type ChampionsFiltered = {
  intersection: Champion[];
  difference: Champion[];
}

type Loading = {
  saveButton: {
    isLoading: boolean
  }
}

export default function ClientComponent({ user = undefined }: { user?: User | null }) {
  const champions = useRef<Champion[] | null>(null)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const [championsByUser, setChampionsByUser] = useState<number[]>([])
  const [championsFiltered, setChampionsFiltered] = useState<ChampionsFiltered>()
  const [search, setSearch] = useState<string>("")
  const [loading, setLoading] = useState<Loading>({ saveButton: { isLoading: false } })
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const getData = async () => {
      if (user) {
        const [championsRes, championsByUserRes] = await Promise.all([
          supabase.from('champions').select('id, name').then(res => res.data),
          supabase.from('champions_by_user').select('champions_ids').then(res => res.data)
        ])
        champions.current = championsRes
        setChampionsByUser((championsByUserRes && championsByUserRes[0]?.champions_ids) ? championsByUserRes[0].champions_ids : [])
      }
      else {
        const [championsRes] = await Promise.all([
          supabase.from('champions').select().then(res => res.data),
        ])
        champions.current = championsRes
        let local_champion_ids = localStorage.getItem('champion_ids')
        if (local_champion_ids && /^\[([0-9]*,)*[0-9]*\]$/.test(local_champion_ids)) {
          try {
            let array = JSON.parse(local_champion_ids)
            setChampionsByUser(array)
          } catch (error) {
            setChampionsByUser([])
          }
        }
        else {
          setChampionsByUser([])
        }
      }
    }

    getData()
  }, [])

  useEffect(() => {
    if (!championsByUser || !champions.current) return
    let championsPool = champions.current.filter((object) => object.name?.toLowerCase().includes(search.toLowerCase()))
    let intersection = championsPool.filter((object) => championsByUser.includes(object.id))
    let difference = championsPool.filter((object) => !championsByUser.includes(object.id))

    setChampionsFiltered({ intersection: intersection, difference: difference })
  }, [championsByUser, search])

  function callback(id: number) {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
    }
    saveTimer.current = setTimeout(() => {
      handleSave()
    }, 60000)
    setChampionsByUser(prevState => {
      if (prevState.includes(id)) {
        let index = prevState.indexOf(id)
        prevState.splice(index, 1)
        return [...prevState]
      }
      else {
        prevState.push(id)
        return [...prevState]
      }
    })
  }

  const handleSave = async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
    }
    setLoading(prevState => {
      let newState = { ...prevState, saveButton: { isLoading: true } }
      return newState
    })
    if (user) {
      const { data, error } = await supabase.from('champions_by_user').update({ champions_ids: championsByUser }).eq('id', user.id)
      console.log(data)
      console.log(error)
    }
    else {
      localStorage.setItem('champion_ids', ['[', championsByUser.toString(), ']'].join(''))
    }
    setLoading(prevState => {
      let newState = { ...prevState, saveButton: { isLoading: false } }
      return newState
    })
  }

  return (
    <main className='grid grid-cols-2 grid-rows-[auto,1fr] h-full overflow-auto'>
      <header className='col-span-2 p-2 flex flex-row justify-between items-center'>
        <div className='w-full text-start'>
          <button
            className='bg-green-600 px-2 text-[#e2e2e2] disabled:bg-gray-600'
            title='Saves automatically 60s after last change'
            onClick={handleSave}
            disabled={loading.saveButton.isLoading}>
            Save
          </button>
          {loading.saveButton.isLoading &&
            <i className="inline-block mx-1 h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status">
            </i>
          }
        </div>
        <div className='w-full text-center'>
          <div className="">
            <div className="relative flex w-full flex-wrap items-stretch">
              <input
                type="search"
                className="relative m-0 block w-[1px] min-w-0 flex-auto rounded border border-solid border-neutral-300 dark:border-neutral-600 bg-transparent bg-clip-padding px-2 text-base font-normal leading-[1.6] outline-none transition duration-200 ease-in-out focus:z-[3] focus:border-primary focus:shadow-[inset_0_0_0_1px_rgb(59,113,202)] focus:outline-none dark:focus:border-primary"
                placeholder="Search"
                aria-label="Search"
                aria-describedby="button-addon2"
                title='Skip apostrophes, dots and spaces when searching (e.g. Dr. Mundo -> DrMundo)'
                value={search}
                disabled={!championsFiltered}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        <div className='w-full text-end'>

        </div>
      </header>
      {championsFiltered &&
        <>
          <div className='overflow-y-scroll scrollbar-hide bg-lime-800/20 border-r-2 border-t-4 border-[var(--background-slight)]'>
            <ListOfChampions champions={championsFiltered.difference} callback={callback} />
          </div>
          <div className='overflow-y-scroll scrollbar-hide bg-rose-800/20 border-l-2 border-t-4 border-[var(--background-slight)]'>
            <ListOfChampions champions={championsFiltered.intersection} callback={callback} />
          </div>
        </>
      }
      {!championsFiltered &&
        <div className="flex col-span-2 justify-center items-center">
          <i className="inline-block mx-1 h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status">
          </i>
        </div>
      }
    </main>
  )
}