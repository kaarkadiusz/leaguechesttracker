'use client'
import AlertList from "@/components/AlertList";
import { AlertProps } from "@/components/AlertList";
import { useEffect, useState } from "react";

export default function Home() {
    const [alerts, setAlerts] = useState<AlertProps[]>([])
        
    useEffect(() => {
        setAlerts(prevState => {
            prevState.push({text: '0', style: 'SUCCESS'})
            prevState.push({text: '1', style: 'SUCCESS'})
            prevState.push({text: '2', style: 'SUCCESS'})
            prevState.push({text: '3', style: 'SUCCESS'})
            prevState.push({text: '4', style: 'SUCCESS'})
            return [...prevState]
        })
    }, [])
    const closeCallback = (index: number) => {
        setAlerts(prevState => {
            prevState.splice(index, 1)
            return [...prevState]
        })
    }
    return(
        <>
            <AlertList alerts={alerts} closeCallback={closeCallback}/>
        </>
    )
}