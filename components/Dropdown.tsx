'use client'
import { useState, useEffect, useRef, MouseEventHandler } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCaretDown } from "@fortawesome/free-solid-svg-icons"

function Item({ text, onClick }: { text: string, onClick?: MouseEventHandler }) {
    return (<button onClick={onClick} className="py-1 px-2 hover:bg-[var(--background-slight)] w-full h-full">{text}</button>)
}

function Divider() {
    return (<hr className="border-[1px] border-slate-800/50 dark:border-slate-400/50" />)
}

export default function Dropdown({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState<boolean>(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLElement)) {
            setOpen(false)
        }
    }

    useEffect(() => {
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    return (
        <div className="relative z-auto" ref={dropdownRef} >
            <button onClick={() => setOpen(prevState => !prevState)} className="flex items-center justify-center aspect-square w-7 h-6">
                <FontAwesomeIcon icon={faCaretDown} className="border-[2px] border-slate-800/50 dark:border-slate-400/50 rounded-md bg-[var(--background-hex)] h-full w-full" />
            </button>
            {open &&
            <div className={`absolute right-0 mt-0.5 w-44 ${open ? "z-50" : "z-10"}
            border-[2px] border-slate-800/50 dark:border-slate-400/50 rounded-md 
            bg-[var(--background-slighter)] overflow-hidden`}
            >
                {children}
            </div>
            }
        </div>
    )
}

Dropdown.Item = Item
Dropdown.Divider = Divider