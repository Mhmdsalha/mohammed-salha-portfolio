import { LoginForm } from "@/components/dashboard/LoginForm";
import { Background } from "@/components/ui/Background";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Background />
      <LoginForm />
    </main>
  );
}
