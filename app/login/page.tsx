'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

import type { Database } from '@/types/supabase'
import AlertList, { AlertProps } from '@/components/AlertList'

interface User {
  email: string
  signedIn: number
}

enum LoginAction {
  SIGNIN = 0,
  SIGNUP,
  PASSWORD_RECOVERY
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [disabled, setDisabled] = useState(true)
  const disabledRef = useRef(true)
  const [alerts, setAlerts] = useState<AlertProps[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User>({ email: '', signedIn: 0 })
  const [loginAction, setLoginAction] = useState<LoginAction>(LoginAction.SIGNIN)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user === null) {
        setUser({ email: '', signedIn: 1 })
      }
      else {
        setUser({ email: user.email ?? '', signedIn: 2 })
      }
    }

    fetchUser()

    
  }, [supabase.auth])

  useEffect(() => {
    if(user && user.signedIn === 2) {
      const requestUrl = new URL(location.href)
      const redirectedFrom = requestUrl.searchParams.get('redirectedFrom')
  
      if (redirectedFrom) {
        setAlerts(prevState => {
          prevState.push({ text: 'It is advised to change your password now if You have logged in using password recovery', style: 'WARNING' })
          return [...prevState]
        })
      }
    }
  }, [user])

  useEffect(() => {
    if (
      (/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email) && password.length >= 6) ||
      (/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email) && loginAction === LoginAction.PASSWORD_RECOVERY) ||
      (password.length >= 6 && user.signedIn === 2)) {
      if (disabledRef.current) {
        setDisabled(false)
        disabledRef.current = false
      }
    }
    else {
      if (!disabledRef.current) {
        setDisabled(true)
        disabledRef.current = true
      }
    }
  }, [email, password, loginAction, user])

  const handleSignUp = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/confirm-signup`,
      },
    })
    setLoading(false)
    if (!error) {
      setAlerts(prevState => {
        prevState.push({ text: 'A confirmation email was sent to given email address, unless it\'s already in use.', style: 'WARNING' })
        return [...prevState]
      })
    }
    else {
      setAlerts(prevState => {
        prevState.push({ text: `An error occured (${error.message})`, style: 'ERROR' })
        return [...prevState]
      })
    }
    // router.refresh()
  }

  const handleSignIn = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (!error) {
      setAlerts(prevState => {
        prevState.push({ text: 'Signed in. Redirecting to home page...', style: 'SUCCESS' })
        return [...prevState]
      })
      router.push('/')
    }
    else {
      setAlerts(prevState => {
        prevState.push({ text: `An error occured (${error.message})`, style: 'ERROR' })
        return [...prevState]
      })
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
    location.reload()
  }

  const handleRecover = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/password-reset` })
    if (!error) {
      setAlerts(prevState => {
        prevState.push({ text: `A login link was sent, unless the given email is not associated with any account`, style: 'WARNING' })
        return [...prevState]
      })
    }
    else {
      setAlerts(prevState => {
        prevState.push({ text: `An error occured (${error.message})`, style: 'ERROR' })
        return [...prevState]
      })
    }
    setLoading(false)

  }

  const handlePasswordChange = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.updateUser({
      email: user.email,
      password: password
    })
    if (!error) {
      setAlerts(prevState => {
        prevState.push({ text: `Your password has been changed`, style: 'SUCCESS' })
        return [...prevState]
      })
    }
    else {
      setAlerts(prevState => {
        prevState.push({ text: `An error occured (${error.message})`, style: 'ERROR' })
        return [...prevState]
      })
    }
    setLoading(false)

  }

  const renderView = () => {
    switch (user.signedIn) {
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
            <h2 className='flex items-center h-full text-3xl'><a className='hover:cursor-pointer p-1' onClick={() => router.push('/')}>LeagueChestTracker</a></h2>
            <div className='flex flex-col gap-6 w-full h-full p-4 '>
              <input
                name="email"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className='my-input w-full mt-2'
                placeholder='Email'
                required
              />
              {loginAction !== LoginAction.PASSWORD_RECOVERY &&
                <input
                  type="password"
                  name="password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  minLength={6}
                  className='my-input w-full'
                  placeholder='Password'
                  required
                />}
              {loginAction === LoginAction.SIGNUP && <button onClick={handleSignUp} className='my-button submit-button w-full' disabled={disabled}>Sign up</button>}
              {loginAction === LoginAction.SIGNIN && <button onClick={handleSignIn} className='my-button submit-button w-full' disabled={disabled}>Sign in</button>}
              {loginAction === LoginAction.PASSWORD_RECOVERY && <button onClick={handleRecover} className='my-button submit-button w-full' disabled={disabled}>Recover password</button>}
            </div>
            <div className='flex flex-row items-end justify-between w-full h-full '>
              <p className='text-xs text-start mb-2 mx-2'>
                <button className='underline' onClick={() => setLoginAction(prevstate => prevstate === LoginAction.SIGNIN ? LoginAction.SIGNUP : LoginAction.SIGNIN)}>Click here</button>
                &nbsp;to {loginAction === LoginAction.SIGNIN ? "sign up" : "sign in"} instead.
              </p>
              {loginAction === LoginAction.SIGNIN &&
                <p className='text-xs text-end mb-2 mx-2'>
                  <button className='underline' onClick={() => setLoginAction(LoginAction.PASSWORD_RECOVERY)}>Forgotten password?</button>
                </p>
              }
            </div>
          </div>
        )
      case 2:
        return (
          <div className='flex flex-col items-center justify-between 
      w-1/2 h-1/2 max-w-sm min-w-fit max-h-sm min-h-fit 
      bg-[var(--background-slight)] border-[var(--background-slighter)] border-2 rounded-lg'>
            <h2 className='flex items-center h-1/3 text-3xl'><a className='hover:cursor-pointer p-1' onClick={() => router.push('/')}>LeagueChestTracker</a></h2>
            <div className='flex flex-col h-full w-full p-4 justify-center'>
              <p>You are already logged in as <span className='italic'>{[user.email.slice(0, 3), '***', user.email.slice(-3)]} </span></p>
              <p className='mb-2'>You can change your password here: </p>
              <input
                type="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                minLength={6}
                className='my-input w-full'
                placeholder='Password'
                required
              />
              <button onClick={handlePasswordChange} className='my-button w-full mt-2' disabled={disabled}>Change password</button>
            </div>
            <div className='flex flex-row w-full p-4 gap-2'>
              {/* <p>You can either sign out or return to home page.</p> */}
              <button onClick={handleSignOut} className='my-button w-full'>Sign out</button>
              <button onClick={() => router.push("/")} className='my-button w-full'>Home page</button>
            </div>
          </div>
        )
    }
  }

  const closeCallback = (index: number) => {
    setAlerts(prevState => {
      prevState.splice(index, 1)
      return [...prevState]
    })
  }

  return (
    <div className='flex flex-col justify-center items-center h-screen w-screen m-auto'>
      {renderView()}
      <div className='flex flex-col justify-center items-center m-2 w-1/2 p-2 text-center absolute top-0'>
        <div
          className={`inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${loading ? "opacity-100" : "opacity-0"}`}
          role="status">
        </div>
      </div>
      <AlertList alerts={alerts} closeCallback={closeCallback} />
    </div>
  )
}