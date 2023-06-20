'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import type { Database } from '@/types/supabase'
import Alert from '@/components/Alert'

interface User {
  email: string
  number: number
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reload, setReload] = useState(false)
  const [loading, setLoading] = useState({loading: false, text: ""})
  const [user, setUser] = useState<User>({ email: '', number: 0 })
  const [loginAction, setLoginAction] = useState<Boolean>(true)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user === null) {
        setUser({ email: '', number: 1 })
      }
      else {
        setUser({ email: user.email ?? '', number: 2 })
      }
    }

    fetchUser()
  }, [])

  const handleSignUp = async () => {
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/confirm-signup`,
      },
    })
    router.refresh()
  }

  const handleSignIn = async () => {
    setLoading(() => ({loading: true, text: ""}))
    await supabase.auth.signInWithPassword({
      email,
      password,
    }).then((response) => {
      if(response.error !== null){
        setLoading({loading: false, text: "Invalid credentials"})
      }
      else {
        setLoading({loading: false, text: "Signed in successfully. Redirecting..."})
        router.push("/")
      }
    }).catch(err => {
      console.error(err)
      setLoading({loading: false, text: "Unindentified error"})
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }
  const renderView = () => {
    switch (user.number) {
      case 0:
        return (
          <div className="flex flex-col gap-2 justify-center items-center w-fit m-auto h-full">
            <div
              className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status">
            </div>
            <strong>User fetching...</strong>
          </div>
        )
      case 1:
        return (
          <div className='flex flex-col items-center justify-between 
      w-1/2 h-1/2 max-w-sm min-w-fit max-h-sm min-h-fit 
      bg-[var(--background-slight)] border-[var(--background-slighter)] border-2 rounded-lg'>
            <h2 className='flex items-center  h-full text-3xl'>LeagueChestTracker</h2>
            <div className='flex flex-col gap-6 w-full h-full p-4 '>
              <input
                name="email"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className='my-input w-full mt-2'
                placeholder='Email' />
              <input
                type="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                minLength={6}
                className='my-input w-full mb-4'
                placeholder='Password'
              />
              {!loginAction && <button onClick={handleSignUp} className='my-button w-full'>Sign up</button>}
              {loginAction && <button onClick={handleSignIn} className='my-button w-full'>Sign in</button>}
            </div>
            <div className='flex items-end h-full '>
              <p className='text-xs mb-2'>
                <button className='underline' onClick={() => setLoginAction(prevstate => !prevstate)}>Click here</button>
                &nbsp;to {loginAction ? "sign up" : "sign in"} instead.
              </p>
            </div>
          </div>
        )
      case 2:
        return (
          <div className='flex flex-col items-center justify-between 
      w-1/2 h-1/2 max-w-sm min-w-fit max-h-sm min-h-fit 
      bg-[var(--background-slight)] border-[var(--background-slighter)] border-2 rounded-lg'>
            <h2 className='flex items-center h-full text-3xl'>LeagueChestTracker</h2>
            <div className='flex flex-col h-full w-full p-4 justify-center'>
              <p>U are already logged in as </p>
              <span className='italic text-center'>{[user.email.slice(0, 3), '***', user.email.slice(-3)]} </span>
              <p>You can either sign out or return to home page.</p>
            </div>
            <div className='flex flex-col h-1/2 w-full p-4 gap-2'>
              <button onClick={handleSignOut} className='my-button w-full'>Sign out</button>
              <button onClick={() => router.push("/")} className='my-button w-full'>Home page</button>
            </div>
          </div>
        )
    }
  };
  return (
    <div className='flex flex-col justify-center items-center h-screen w-screen m-auto'>
      {renderView()}
      <div className='flex flex-col justify-center items-center m-2 w-1/2 p-2 text-center absolute bottom-0'>
        <strong className={`text-red-500 ${loading.text !== "" ? "opacity-100" : "opacity-0"}`}>{loading.text}</strong>
        <div
          className={`inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${loading.loading ? "opacity-100" : "opacity-0"}`}
          role="status">
        </div>
      </div>
      <Alert text={['abc','efg']}/>
    </div>
  )
}