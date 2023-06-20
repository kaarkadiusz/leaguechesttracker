

export default function Alert({ text }: { text: string[] }) {

    return (
        <div className="flex flex-col absolute bottom-2 left-1/2 -translate-x-1/2 gap-2">
            {text.map((element, index) => {
                return (
                    <div key={index} className="bg-[var(--background-slighter)] border-[var(--background-slight)] border-4 rounded-md px-6 py-2">
                        {element}
                    </div>
                )
            })}
        </div>
    )
}