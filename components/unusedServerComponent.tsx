import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

import type { Database } from '@/types/supabase'

export default async function ServerComponent() {
    const supabase = createServerComponentClient<Database>({ cookies })
    const { data } = await supabase.from('example_todo').select()
    const { data: { user } } = await supabase.auth.getUser()
    return (
        <pre>
            {JSON.stringify(data, null, 2)} <br />
            {JSON.stringify(user, null, 2)}
        </pre>)
}