import ClientComponent from "@/components/ClientComponent"
import Header from "@/components/Header"

import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export default async function Home() {
  const supabase = createServerComponentClient<Database>({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="flex flex-col h-screen">
      <Header user={user}/>
      <ClientComponent user={user}/>
    </main>
  )
}
