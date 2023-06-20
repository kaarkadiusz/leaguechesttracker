import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

import type { Database } from '@/types/supabase'

export default async function ServerComponent() {
    const supabase = createServerComponentClient<Database>({ cookies })
    const { data } = await supabase.from('example_todo').select()
    return (
        <pre>
            {JSON.stringify(data, null, 2)} <br />
        </pre>)
}