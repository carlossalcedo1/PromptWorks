import { Link } from "react-router-dom";
import { Logo } from "../../components/layout/Logo.jsx";
import { AuthNav } from "../../components/layout/AuthNav.jsx";
import { EmailCodeForm } from "../../components/auth/EmailCodeForm.jsx";

export default function Login() {
  return (
    <div className="relative min-h-dvh">
      <Link to="/" className="absolute left-6 top-6 md:left-10 md:top-8" aria-label="Promptworks home">
        <Logo />
      </Link>
      <AuthNav />
      <EmailCodeForm />
    </div>
  );
}
