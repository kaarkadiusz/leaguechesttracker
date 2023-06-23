'use client'

import { User, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Dropdown from '@/components/Dropdown'
import { useRouter } from 'next/navigation'

import type { Database } from '@/types/supabase'

interface Props {
  user?: User | null;
}

export default function Header({ user = undefined }: Props) {
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
          <i className='mr-2' title='Data will be saved to localstorage'>You are not signed in</i>
        );
      case user?.aud === 'authenticated':
        return (
          <i className='mr-2' title='Data will be saved to server'>You are signed in</i>
        );
      default:
        return <div>Unexpected authentication error</div>;
    }

  }

  return (
    <>
    <header className='text-end px-3 py-2 w-full border-b-2 shadow-2xl bg-[var(--background-slight)] border-slate-900'>
      <div className="flex flex-row justify-between items-center">
        <div className=''>LeagueChestTracker</div>
        {/* <div className=''>{userInfo()} <Dropdown><Dropdown.Item onClick={() => console.log("item1")}/> <Dropdown.Item onClick={() => console.log("item2")}/></Dropdown></div> */}
        <div className='flex flex-row items-center gap-1'>
          {userInfo()}
          <Dropdown>
            {user?.aud === 'authenticated' && 
            <>
              <Dropdown.Item text="Change password" onClick={() => router.push("/login")} />
              <Dropdown.Divider />
              <Dropdown.Item text="Sign out" onClick={handleSignOut} />
            </>
            }
            {user === null && <Dropdown.Item text="Sign in" onClick={() => router.push("/login")} />}
          </Dropdown>
        </div>
      </div>
    </header>
    </>
  )
}