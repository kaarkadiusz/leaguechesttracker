'use client'

import { Session, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { Database } from '@/types/supabase'


export default function Header() {
    const [session, setSession] = useState<number>(0)
    const supabase = createClientComponentClient<Database>()
    const router = useRouter()
    useEffect(() => {
        async function fetchSession() {
            await supabase.auth.getSession().then((response) => {
                if(response.data.session === null) {
                    setSession(1)
                }
                else setSession(2)
            })
        }

        fetchSession()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        // router.refresh()
        location.reload()
      }

    const userInfo = () => {
        switch(session) {
            case 0: return
            case 1: return(<button className='my-button w-24' onClick={() => router.push("/login")}>Sign in</button>)
            case 2: return(<div><i className='mr-2'>You are signed in</i><button className='my-button w-24' onClick={handleSignOut}>Sign out</button></div>)
        }
    }

    return (
        <header className='text-end px-3 py-2 w-full border-b-2 border-slate-900'>
            <div className="flex flex-row justify-between items-center">
                <div className=''>LeagueChestTracker</div>
                <div className=''>{userInfo()}</div>
            </div>
        </header>
    )
}