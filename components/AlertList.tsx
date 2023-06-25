// 'use client'
import { AlertProps as AlertPropsOg, AlertStyle } from '@/components/Alert'
import Alert from '@/components/Alert'
// import { useState } from 'react'

export type AlertProps = Omit<AlertPropsOg, 'style' | 'closeCallback'> & { style?: 'SUCCESS' | 'WARNING' | 'ERROR' | 'DEFAULT'}

type AlertList = {
    alerts: AlertProps[];
    closeCallback: Function;
    alertDismiss?: string;
}

export default function AlertList({ alerts, closeCallback, alertDismiss }: AlertList) {
    return (
        <div className="flex flex-col justify-center items-center absolute bottom-2 left-1/2 -translate-x-1/2 gap-2 z-30">
            {alerts.length - 3 > 0 && <div className='text-xs'>+{alerts.length - 3} more alert{alerts.length - 3 === 1 ? "" : "s"}</div>}
            {alerts.slice(0, 3).map((obj, index) => (
                <Alert 
                    key={index} 
                    closeCallback={() => closeCallback(index)} 
                    text={obj.text} style={AlertStyle[obj.style ?? 'DEFAULT']} 
                    customStyling={obj.customStyling}
                    alertDismiss={alertDismiss}
                />
            ))}
        </div>
    )
}