'use client'

import { User, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { Database } from '@/types/supabase'

interface Props {
    user?: User | null;
}

export default function Header({user = undefined} : Props) {
    const supabase = createClientComponentClient<Database>()
    const router = useRouter()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        location.reload()
      }

    const userInfo = () => {
        switch (true) {
            case user === undefined:
              return;
            case user === null:
              return (
                <div>
                  <i className='mr-2' title='Data will be saved to localstorage'>You are not signed in</i>
                  <button className='my-button w-24 text-[#e2e2e2]' onClick={() => router.push("/login")}>
                    Sign in
                  </button>
                </div>
              );
            case user?.aud === 'authenticated':
              return (
                <div>
                  <i className='mr-2' title='Data will be saved to server'>You are signed in</i>
                  <button className='my-button w-24 text-[#e2e2e2]' onClick={() => handleSignOut()}>
                    Sign out
                  </button>
                </div>
              );
            default:
              return <div>Unexpected authentication error</div>;
          }
          
    }

    return (
        <header className='text-end px-3 py-2 w-full border-b-2 shadow-2xl bg-[var(--background-slight)] border-slate-900'>
            <div className="flex flex-row justify-between items-center">
                <div className=''>LeagueChestTracker</div>
                <div className=''>{userInfo()}</div>
            </div>
        </header>
    )
}