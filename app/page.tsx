import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Email Parser</Link>
            </div>
            <AuthButton />
          </div>
        </nav>
        
        <div className="flex-1 flex flex-col gap-6 max-w-5xl p-5">
          <h1 className="text-3xl font-bold text-center">Email Parser</h1>
          <p className="text-center text-muted-foreground">
            Transform your emails into structured data
          </p>
          {/* Main content will be built here */}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>Email Parser Application</p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
