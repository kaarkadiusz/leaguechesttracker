
export enum AlertStyle {
    'SUCCESS' = "bg-green-500 border-green-800",
    'WARNING' = "bg-yellow-600 border-yellow-900",
    'ERROR' = "bg-red-500 border-red-800",
    'DEFAULT' = "bg-[var(--background-slighter)] border-[var(--background-slight)]"
}

export type AlertProps = {
    text: string;
    closeCallback: Function;
    style?: AlertStyle;
    customStyling?: string;
}

export default function Alert({ text, closeCallback ,style = AlertStyle.DEFAULT, customStyling = "" }: AlertProps) {
    // setTimeout(() => {
    //     closeCallback()
    // }, 5000);
    return (
        <div className={`alert-parent text-center relative border-4 rounded-md w-fit h-fit px-6 py-2 opacity-90 ${style} ${customStyling}`}>
            <button onClick={() => closeCallback()} className="alert-close opacity-0 hover:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" 
                className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 aspect-square w-4 bg-slate-600 border border-slate-800 text-white rounded-full">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <span className="text-center">
                {text}
            </span>
        </div>
    )
}