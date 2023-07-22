import ClientComponent from "@/components/ClientComponent"
import Header from "@/components/Header"

export default async function Home() {
  
  return (
    <main className="flex flex-col h-screen">
      <Header/>
      <ClientComponent/>
    </main>
  )
}
