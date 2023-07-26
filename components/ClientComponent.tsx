'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState, useRef } from 'react';

import ListOfChampions from './ListOfChampions';
import { User } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { ChampionsJSON, validate } from '@/types/champions_jsonschema';
import AlertList, { AlertProps } from './AlertList';

type Champion = {
  id: number;
  champion: string;
  name: string;
};

type ChampionsFiltered = {
  intersection: Champion[];
  difference: Champion[];
};

type Loading = {
  listOfChampions: {
    isLoading: boolean;
  };
  saveButton: {
    isLoading: boolean;
  };
};

type Settings = {
  gridCols: string;
  portraits: boolean;
  alertDismiss: string;
}

enum ModalType {
  CLOSED,
  EXPORTDATA,
  IMPORTDATA,
  CLEARDATA,
  EDITTABS,
  SETTINGS
}

export default function ClientComponent({ user = undefined }: { user?: User | null }): JSX.Element {
  const champions = useRef<Champion[] | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const championsByUserRef = useRef<string>('');
  const [championsByUser, setChampionsByUser] = useState<ChampionsJSON>({ "lists": { "1": [] }, "chosen": "1" });
  const [championsFiltered, setChampionsFiltered] = useState<ChampionsFiltered>();
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<Loading>({ listOfChampions: { isLoading: true }, saveButton: { isLoading: false } });
  const [alerts, setAlerts] = useState<AlertProps[]>([]);
  const [modal, setModal] = useState<{ type: ModalType, text: string }>({ type: ModalType.CLOSED, text: '' });
  const [settings, setSettings] = useState<Settings>({ gridCols: 'auto', portraits: false, alertDismiss: '0' })
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const localStorage_settings = localStorage.getItem('settings')
    if (localStorage_settings) {
      try {
        let json = JSON.parse(localStorage_settings)
        setSettings(prevState => ({
          ...prevState,
          gridCols: json.gridCols ? json.gridCols : prevState.gridCols,
          portraits: json.portraits ? json.portraits : prevState.portraits,
          alertDismiss: json.alertDismiss ? json.alertDismiss : prevState.alertDismiss
        }))
      } catch (error) {
        return
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    const base64 = btoa(JSON.stringify(championsByUser))
    championsByUserRef.current = base64
  }, [championsByUser])

  useEffect(() => {
    const getData = async () => {
      const res = await (await fetch(`/champion_data.json`)).json()
      champions.current = res;
      console.log(res)
      let local_champions = localStorage.getItem('champions');
      if (!local_champions) {
        setChampionsByUser({ "lists": { "1": [] }, "chosen": "1" });
        return;
      }
      let json = null;
      try {
        json = JSON.parse(atob(local_champions));
      } catch (error) {
        setChampionsByUser({ "lists": { "1": [] }, "chosen": "1" });
        return;
      }
      if (!validate(json) || !Object.keys(json.lists).includes(json.chosen)) {
        setChampionsByUser({ "lists": { "1": [] }, "chosen": "1" });
        return;
      }

      setChampionsByUser(json);
    };
    //   if (user) {
    //     const [championsRes, championsByUserRes] = await Promise.all([
    //       supabase.from('champions').select('id, name').then(res => res.data),
    //       supabase.from('champions_by_user').select('champions').then(res => res.data),
    //     ]);
    //     champions.current = championsRes;
    //     if (championsByUserRes && championsByUserRes[0]?.champions) {
    //       let json = JSON.parse(atob(championsByUserRes[0].champions));
    //       setChampionsByUser(json);
    //     }
    //     else setChampionsByUser({ "lists": { "1": [] }, "chosen": "1" });
    //   }
    //   else {
    //     const [championsRes] = await Promise.all([
    //       supabase.from('champions').select().then(res => res.data),
    //     ]);
    //     champions.current = championsRes;
    //   }
    // };

    getData();
    setLoading(prevState => ({ ...prevState, listOfChampions: { isLoading: false } }));
  }, []);

  useEffect(() => {
    if (!championsByUser || !champions.current) return

    const championsPool = champions.current.filter((object) => object.name?.toLowerCase().includes(search.toLowerCase()))
    const chosen = championsByUser["chosen"]
    const intersection = championsPool.filter((object) => championsByUser["lists"][chosen].includes(object.id))
    const difference = championsPool.filter((object) => !championsByUser["lists"][chosen].includes(object.id))

    setChampionsFiltered({ intersection, difference })
  }, [championsByUser, search])

  const callback = (id: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)

    saveTimer.current = setTimeout(() => {
      handleSave()
    }, 60000)

    setChampionsByUser(prevState => {
      const chosen = championsByUser["chosen"]
      const updatedLists = { ...prevState.lists }
      const updatedChampionList = [...updatedLists[chosen]]

      if (updatedChampionList.includes(id)) {
        const index = updatedChampionList.indexOf(id)
        updatedChampionList.splice(index, 1)
        updatedLists[chosen] = updatedChampionList
      } else {
        updatedChampionList.push(id)
        updatedLists[chosen] = updatedChampionList
      }

      return { ...prevState, lists: updatedLists }
    })
  }

  function TabsModal({ initial }: { initial: string[] }) {
    const [tabs, setTabs] = useState<string[]>(initial)
    const [disabled, setDisabled] = useState(false)
    const disabledRef = useRef(true)

    useEffect(() => {
      if (tabs.length !== new Set(tabs).size || !tabs.every((item) => item !== '')) {
        if (!disabledRef.current) {
          setDisabled(true)
          disabledRef.current = true
        }
      }
      else {
        if (disabledRef.current) {
          setDisabled(false)
          disabledRef.current = false
        }
      }
    }, [tabs])

    const saveTabs = () => {
      if (tabs.length !== new Set(tabs).size || !tabs.every((item) => item !== '')) {
        return
      }
      else {
        setChampionsByUser(prevState => {
          const listsValues = Object.values(prevState.lists)
          const newLists: { [x: string]: number[] } = {}
          for (let i = 0; i < tabs.length; i++) {
            if (typeof listsValues[i] !== 'undefined') newLists[tabs[i]] = listsValues[i]
            else newLists[tabs[i]] = []
          }

          return { ...prevState, lists: newLists, chosen: tabs[0] }
        })
        setModal({ type: ModalType.CLOSED, text: "" })
      }
    }

    return (
      <>
        <p>You can use up to 10 tabs.<br /> Tab names must be unique and they cannot be empty.</p>
        <p className='text-red-500'>Removing tabs will delete your data.</p>
        {tabs.map((value, index) =>
          <div className='flex flex-row gap-2' key={index}>
            <input value={value} className='grow p-1 rounded bg-[var(--background-slight)]'
              onChange={(e) => setTabs(prevState => { prevState[index] = e.target.value; return [...prevState] })}
            />
            {index !== 0 &&
              <button className='bg-red-400 text-[#e2e2e2] px-1'
                onClick={() => setTabs(prevState => { prevState.splice(index, 1); return [...prevState] })}>
                Remove
              </button>
            }
          </div>)}
        {tabs.length < 10 &&
          <button
            className='bg-slate-400 px-2 text-[#e2e2e2]'
            onClick={() => setTabs(prevState => {
              prevState.push("")
              return [...prevState]
            })}>
            Add tab
          </button>
        }
        <div className='flex flex-row justify-end gap-2'>
          <button
            className='bg-blue-500 px-2 text-[#e2e2e2] disabled:bg-gray-600'
            onClick={saveTabs}
            disabled={disabled}
          >
            Save
          </button>
          <button
            className='bg-slate-400 px-2 text-[#e2e2e2]'
            onClick={() => setModal({ type: ModalType.CLOSED, text: "" })}>
            Close
          </button>
        </div>
      </>
    )
  }

  const handleSave = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)

    setLoading(prevState => ({ ...prevState, saveButton: { isLoading: true } }))

    if (!validate(championsByUser)) {
      setAlerts(prevState => {
        prevState.push({ text: 'Validation error when processing your data.', style: 'ERROR' })
        return [...prevState]
      })

      setLoading(prevState => ({ ...prevState, saveButton: { isLoading: false } }))
      return
    }
    const base64 = championsByUserRef.current

    if (user) {
      const { data, error } = await supabase.from('champions_by_user').update({ champions: base64 }).eq('id', user.id)

      if (!error) {
        setAlerts(prevState => {
          prevState.push({ text: 'Saved to server.', style: 'SUCCESS' })
          return [...prevState]
        })
      } else {
        localStorage.setItem('champions', base64)
        setAlerts(prevState => {
          prevState.push({ text: `Saved to localStorage due to server error (${error.message}).`, style: 'WARNING' })
          return [...prevState]
        })
      }
    } else {
      localStorage.setItem('champions', base64)
      setAlerts(prevState => {
        prevState.push({ text: 'Saved to localStorage.', style: 'SUCCESS' })
        return [...prevState]
      })
    }

    setLoading(prevState => ({ ...prevState, saveButton: { isLoading: false } }))
  }

  const closeCallback = (index: number) => {
    setAlerts(prevState => {
      prevState.splice(index, 1)
      return [...prevState]
    })
  }

  const openModal = (type: ModalType) => {
    switch (type) {
      case ModalType.EXPORTDATA: {
        const json = JSON.stringify(championsByUser)
        const base64 = btoa(json)
        setModal({ type: ModalType.EXPORTDATA, text: base64 })
        break
      }
      case ModalType.IMPORTDATA: {
        setModal({ type: ModalType.IMPORTDATA, text: "" })
        break
      }
      case ModalType.CLEARDATA: {
        setModal({ type: ModalType.CLEARDATA, text: "" })
        break
      }
      case ModalType.EDITTABS: {
        setModal({ type: ModalType.EDITTABS, text: "" })
        break
      }
      case ModalType.SETTINGS: {
        setModal({ type: ModalType.SETTINGS, text: "" })
        break
      }
    }
  }

  const handleImport = () => {
    try {
      const obj = JSON.parse(atob(modal.text))
      if (validate(obj)) {
        setChampionsByUser(obj)
        setAlerts(prevState => [{ text: 'Your data has been imported.', style: 'SUCCESS' }, ...prevState])
      }
    } catch (error) {
      setAlerts(prevState => [{ text: `An error occurred when importing your data.`, style: 'ERROR' }, ...prevState])
    }
  }

  const handleClear = () => {
    const chosen = championsByUser["chosen"]
    setChampionsByUser(prevState => ({ ...prevState, lists: { ...prevState.lists, [chosen]: [] } }))
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
              title="Clear your current tab's data."
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
          <div className='w-full items-end justify-end flex flex-row gap-1'>
            <button
              className='bg-slate-400 px-2 text-[#e2e2e2] disabled:bg-gray-600 mr-2'
              title='Change settings.'
              disabled={loading.listOfChampions.isLoading}
              onClick={() => openModal(ModalType.SETTINGS)}
            >
              Settings
            </button>
            <select name="tabs" value={championsByUser.chosen} className='w-2/5 bg-[var(--background-slight)]'
              onChange={(e) => (setChampionsByUser(prevState => ({ ...prevState, chosen: e.target.value })))}>
              {Object.keys(championsByUser.lists).map((list, index) =>
                <option value={list} key={index}>
                  {list}
                </option>
              )}
            </select>
            <button
              className='bg-slate-400 px-2 text-[#e2e2e2] disabled:bg-gray-600'
              title='Edit tabs.'
              disabled={loading.listOfChampions.isLoading}
              onClick={() => openModal(ModalType.EDITTABS)}
            >
              Edit
            </button>
          </div>
        </header>
        {championsFiltered &&
          <>
            <div className='overflow-y-scroll scrollbar-hide bg-lime-800/20 border-r-2 border-t-4 border-[var(--background-slight)]'>
              <ListOfChampions champions={championsFiltered.difference} callback={callback} gridCols={settings.gridCols} portraits={settings.portraits} />
            </div>
            <div className='overflow-y-scroll scrollbar-hide bg-rose-800/20 border-l-2 border-t-4 border-[var(--background-slight)]'>
              <ListOfChampions champions={championsFiltered.intersection} callback={callback} gridCols={settings.gridCols} portraits={settings.portraits} />
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
        <AlertList alerts={alerts} closeCallback={closeCallback} alertDismiss={settings.alertDismiss} />
      </main>
      {modal.type === ModalType.EXPORTDATA &&
        <div className="absolute w-screen h-screen bg-black/50 z-10 flex justify-center items-center backdrop-blur">
          <div className='bg-[var(--background-hex)] flex flex-col p-4 w-2/5 h-2/5 gap-1'>
            <textarea className='bg-[var(--background-hex)] border border-[var(--background-slight)] h-full w-full resize-none' value={modal.text} readOnly>
            </textarea>
            <p className=''>This text represents your data. Save it in order to be able to import your data later.</p>
            <div className='flex flex-row justify-end gap-2'>
              <button className='bg-slate-400 px-2 text-[#e2e2e2]' onClick={() => setModal({ type: ModalType.CLOSED, text: "" })}>Close</button>
            </div>
          </div>
        </div>
      }
      {modal.type === ModalType.IMPORTDATA &&
        <div className="absolute w-screen h-screen bg-black/50 z-10 flex justify-center items-center backdrop-blur">
          <div className='bg-[var(--background-hex)] flex flex-col p-4 w-2/5 h-2/5 gap-1'>
            <textarea className='bg-[var(--background-hex)] border border-[var(--background-slight)] h-full w-full resize-none'
              onBlur={e => setModal(prevState => ({ ...prevState, text: e.target.value }))}>
            </textarea>
            <p className=''>Import your data by pasting the encoded string above.</p>
            <p className=' text-red-500'>This action will overwrite your current data.</p>
            <div className='flex flex-row justify-end gap-2'>
              <button className='bg-blue-500 px-2 text-[#e2e2e2]' onClick={() => { handleImport(); setModal({ type: ModalType.CLOSED, text: "" }) }}>Import</button>
              <button className='bg-slate-400 px-2 text-[#e2e2e2]' onClick={() => setModal({ type: ModalType.CLOSED, text: "" })}>Close</button>
            </div>
          </div>
        </div>
      }
      {modal.type === ModalType.CLEARDATA &&
        <div className="absolute w-screen h-screen bg-black/50 z-10 flex justify-center items-center backdrop-blur">
          <div className='bg-[var(--background-hex)] flex flex-col p-4 w-fit h-fit gap-1'>
            <p className='text-red-500'>This action will clear your current tab&apos;s data.</p>
            <div className='flex flex-row justify-end gap-2'>
              <button className='bg-yellow-500 px-2 text-[#e2e2e2]' onClick={() => { handleClear(); setModal({ type: ModalType.CLOSED, text: "" }) }}>Clear</button>
              <button className='bg-slate-400 px-2 text-[#e2e2e2]' onClick={() => setModal({ type: ModalType.CLOSED, text: "" })}>Close</button>
            </div>
          </div>
        </div>
      }
      {modal.type === ModalType.EDITTABS &&
        <div className="absolute w-screen h-screen bg-black/50 z-10 flex justify-center items-center backdrop-blur">
          <div className='bg-[var(--background-hex)] flex flex-col p-4 w-fit h-fit gap-1'>
            <TabsModal initial={Object.keys(championsByUser.lists)} />
          </div>
        </div>
      }
      {modal.type === ModalType.SETTINGS &&
        <div className="absolute w-screen h-screen bg-black/50 z-10 flex justify-center items-center backdrop-blur">
          <div className='bg-[var(--background-hex)] flex flex-col p-4 h-fit gap-1 
             w-1/2 sm:w-1/2 md:w-1/3 lg:w-1/4 2xl:w-1/6'>
            <div className='flex flex-row w-full justify-between'>
              <p>Grid columns:</p>
              <select name="gridCols" value={settings.gridCols} className='flex w-2/5 bg-[var(--background-slight)]'
                onChange={(e) => setSettings(prevState => ({ ...prevState, gridCols: e.target.value }))}>
                <option value={'auto'}>auto</option>
                <option value={'2'}>2</option>
                <option value={'3'}>3</option>
                <option value={'4'}>4</option>
                <option value={'5'}>5</option>
                <option value={'6'}>6</option>
                <option value={'7'}>7</option>
                <option value={'8'}>8</option>
                <option value={'9'}>9</option>
                <option value={'10'}>10</option>
              </select>
            </div>
            <div className='flex flex-row w-full justify-between'>
              <p>Portraits:</p>
              <select name="gridCols" value={settings.portraits ? '1' : '0'} className='flex w-2/5 bg-[var(--background-slight)]'
                onChange={(e) => setSettings(prevState => ({ ...prevState, portraits: (e.target.value === '0' ? false : true) }))}>
                <option value={'0'}>rectangular</option>
                <option value={'1'}>circular</option>
              </select>
            </div>
            <div className='flex flex-row w-full justify-between'>
              <p>Dismiss alert:</p>
              <select name="gridCols" value={settings.alertDismiss} className='flex w-2/5 bg-[var(--background-slight)]'
                onChange={(e) => setSettings(prevState => ({ ...prevState, alertDismiss: (e.target.value) }))}>
                <option value={'0'}>0s</option>
                <option value={'1'}>1s</option>
                <option value={'2'}>2s</option>
                <option value={'3'}>3s</option>
                <option value={'4'}>4s</option>
                <option value={'5'}>5s</option>
                <option value={'6'}>6s</option>
                <option value={'7'}>7s</option>
                <option value={'8'}>8s</option>
                <option value={'9'}>9s</option>
                <option value={'10'}>10s</option>
              </select>
            </div>
            <div className='flex flex-row justify-end gap-2'>
              <button className='bg-slate-400 px-2 text-[#e2e2e2]' onClick={() => setModal({ type: ModalType.CLOSED, text: "" })}>Close</button>
            </div>
          </div>
        </div>
      }
    </>
  )
}