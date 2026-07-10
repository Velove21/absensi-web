

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden bg-transparent">
                <img src="/images/logo.png" className="size-8 object-contain" alt="Logo SMKN 2" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-bold">
                    SMKN 2 SURAKARTA
                </span>
            </div>
        </>
    );
}
