'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, useRef } from 'react'

import ListOfChampions from './ListOfChampions'

import { User } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

import AlertList, { AlertProps } from './AlertList'
import Dropdown from '@/components/Dropdown'

type Champion = Omit<Database['public']['Tables']['champions']['Row'], 'image'>

type ChampionsFiltered = {
  intersection: Champion[];
  difference: Champion[];
}

type Loading = {
  listOfChampions: {
    isLoading: boolean
  }
  saveButton: {
    isLoading: boolean
  }
}

enum ModalType {
  CLOSED,
  EXPORTDATA,
  IMPORTDATA,
  CLEARDATA
}

export default function ClientComponent({ user = undefined }: { user?: User | null }) {
  const champions = useRef<Champion[] | null>(null)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const [championsByUser, setChampionsByUser] = useState<number[]>([])
  const [championsFiltered, setChampionsFiltered] = useState<ChampionsFiltered>()
  const [search, setSearch] = useState<string>("")
  const [loading, setLoading] = useState<Loading>({ listOfChampions: { isLoading: true }, saveButton: { isLoading: false } })
  const [alerts, setAlerts] = useState<AlertProps[]>([])
  const [modal, setModal] = useState<{type: ModalType, text: string}>({type: ModalType.CLOSED, text: ""})
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
    setLoading(prevState => ({...prevState, listOfChampions: {isLoading: false}}))
  }, [supabase, user])

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

  const handleSave = async (imported? : number[]) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
    }
    setLoading(prevState => {
      let newState = { ...prevState, saveButton: { isLoading: true } }
      return newState
    })
    if (user) {
      const { data, error } = await supabase.from('champions_by_user').update({ champions_ids: imported ?? championsByUser }).eq('id', user.id)
      if(!error)
      {
        setAlerts(prevState => {
          prevState.push({text: 'Saved to server.', style: 'SUCCESS'})
          return [...prevState]
        })
      }
      else
      {
        if (imported) localStorage.setItem('champion_ids', ['[', imported.toString(), ']'].join(''))
        else localStorage.setItem('champion_ids', ['[', championsByUser.toString(), ']'].join(''))
        setAlerts(prevState => {
          prevState.push({text: `Saved to localStorage due to server error (${error.message}).`, style: 'WARNING'})
          return [...prevState]
        })
      }
    }
    else {
      if (imported) localStorage.setItem('champion_ids', ['[', imported.toString(), ']'].join(''))
      else localStorage.setItem('champion_ids', ['[', championsByUser.toString(), ']'].join(''))
      setAlerts(prevState => {
        prevState.push({text: 'Saved to localStorage.', style: 'SUCCESS'})
        return [...prevState]
      })
    }
    setLoading(prevState => {
      let newState = { ...prevState, saveButton: { isLoading: false } }
      return newState
    })
  }

  const closeCallback = (index: number) => {
    setAlerts(prevState => {
      prevState.splice(index, 1)
      return [...prevState]
    })
  }

  const openModal = (type: ModalType) => {
    switch(type) {
      case ModalType.EXPORTDATA: {
        let json = JSON.stringify(championsByUser)
        let base64 = btoa(json)
        setModal({type: ModalType.EXPORTDATA, text:base64})
        break
      }
      case ModalType.IMPORTDATA: {
        setModal({type: ModalType.IMPORTDATA, text:""})
        break
      }
      case ModalType.CLEARDATA: {
        setModal({type: ModalType.CLEARDATA, text:""})
        break
      }
    }
  }

  const handleImport = () => {
    try {
      let json = atob(modal.text)
      let obj = JSON.parse(json)
      if(Array.isArray(obj))
      {
        setChampionsByUser(obj)
        handleSave(obj)
        setAlerts(prevState => {
          prevState.push({text: 'Your data has been imported.', style: 'SUCCESS'})
          return [...prevState]
        })
      }
    } catch (error) {
      setAlerts(prevState => {
        prevState.push({text: `An error occured when importing your data`, style: 'ERROR'})
        return [...prevState]
      })
      return
    }
  }

  return (
    <>
    <main className='grid grid-cols-2 grid-rows-[auto,1fr] h-full overflow-auto'>
      <header className='col-span-2 p-2 flex flex-col justify-between items-center sm:flex-row'>
        <div className='w-full text-start flex flex-col sm:flex-row gap-1'>
          <button
            className='bg-green-600 px-2 text-[#e2e2e2] disabled:bg-gray-600'
            title='Save your data. Saves automatically 60s after last change.'
            onClick={() => handleSave()}
            disabled={loading.saveButton.isLoading || loading.listOfChampions.isLoading}>
            Save
            {loading.saveButton.isLoading &&
            <i className="inline-block mx-1 h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status">
            </i>
            }
          </button>
          <button
            className='bg-blue-500 px-2 text-[#e2e2e2] disabled:bg-gray-600'
            title='Export your data.'
            onClick={() => openModal(ModalType.EXPORTDATA)}
            disabled={loading.listOfChampions.isLoading}
            >
            Export
          </button>
          <button
            className='bg-blue-500 px-2 text-[#e2e2e2] disabled:bg-gray-600'
            title='Import your data.'
            disabled={loading.listOfChampions.isLoading}
            onClick={() => openModal(ModalType.IMPORTDATA)}
            >
            Import
          </button>
          <button
            className='bg-yellow-500 px-2 text-[#e2e2e2] disabled:bg-gray-600'
            title='Clear your data.'
            disabled={loading.listOfChampions.isLoading}
            onClick={() => openModal(ModalType.CLEARDATA)}
            >
            Clear
          </button>
          
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
          <button
            className='bg-slate-400 px-2 text-[#e2e2e2] disabled:bg-gray-600'
            title='Change settings.'
            // onClick={handleClear}
            >
            Settings
          </button>
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
      <AlertList alerts={alerts} closeCallback={closeCallback} />
    </main>
    {modal.type === ModalType.EXPORTDATA &&
    <div className="absolute w-screen h-screen bg-black/50 z-10 flex justify-center items-center backdrop-blur">
      <div className='bg-[var(--background-hex)] flex flex-col p-4 w-2/5 h-2/5 gap-1'>
        <textarea className='bg-[var(--background-hex)] border border-[var(--background-slight)] h-full w-full resize-none' value={modal.text} readOnly>
        </textarea>
        <p className=''>This text represents your data. Save it in order to be able to import your data later.</p>
        <button className='bg-slate-400 px-2 text-[#e2e2e2] disabled:bg-gray-600' onClick={() => setModal({type: ModalType.CLOSED, text: ""})}>Close</button>
      </div>
    </div>
    }
    {modal.type === ModalType.IMPORTDATA &&
    <div className="absolute w-screen h-screen bg-black/50 z-10 flex justify-center items-center backdrop-blur">
      <div className='bg-[var(--background-hex)] flex flex-col p-4 w-2/5 h-2/5 gap-1'>
        <textarea className='bg-[var(--background-hex)] border border-[var(--background-slight)] h-full w-full resize-none'
        onBlur={e => setModal(prevState => ({...prevState, text: e.target.value}))}>
        </textarea>
        <p className=''>Import your data by pasting the encoded string above.</p>
        <p className=' text-red-500'>This action will overwrite your current data.</p>
        <button className='bg-blue-500 px-2 text-[#e2e2e2] disabled:bg-gray-600' onClick={() => {handleImport(); setModal({type: ModalType.CLOSED, text: ""})}}>Import</button>
        <button className='bg-slate-400 px-2 text-[#e2e2e2] disabled:bg-gray-600' onClick={() => setModal({type: ModalType.CLOSED, text: ""})}>Close</button>
      </div>
    </div>
    }
    {modal.type === ModalType.CLEARDATA &&
    <div className="absolute w-screen h-screen bg-black/50 z-10 flex justify-center items-center backdrop-blur">
      <div className='bg-[var(--background-hex)] flex flex-col p-4 w-2/5 h-fit gap-1'>
        <p className=' text-red-500'>This action will clear your current data.</p>
        <button className='bg-yellow-500 px-2 text-[#e2e2e2] disabled:bg-gray-600' onClick={() => {setChampionsByUser([]); handleSave([]); setModal({type: ModalType.CLOSED, text: ""})}}>Clear</button>
        <button className='bg-slate-400 px-2 text-[#e2e2e2] disabled:bg-gray-600' onClick={() => setModal({type: ModalType.CLOSED, text: ""})}>Close</button>
      </div>
    </div>
    }
    </>
  )
}